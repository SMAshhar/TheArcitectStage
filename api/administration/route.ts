import { NextRequest, NextResponse } from "next/server";
import { sign as jwtSign, decode, verify } from "jsonwebtoken";
import { db, administrationauthoritytable } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { errorCodes } from "../errorCodes";
import { v4 as uuidv4 } from "uuid";
import { adminLimiter } from "../config/limiter";



interface Req {
  adminEmailAddress: string;
  adminPassword: string;
}


// This API will take Login Request as administrator and generate accessToken if there is none. It will:
//  1. Check if there is an access token.
//  2. If there is an access token saved in cookies, it will call the '/auth' API to:
//     a. Check the validity with respect to time. NOTE: 24 hours validity per token.
//     b. Authenticate it via a secret text stored in database.
//     c. NOTE: If accessToken is altered by any means. This page would not let you through. Better delete that from cookies and enter access information again.
//  3. If access token checks out, you are then allowed to head to '/studio' to access your sanity page. Again, you have to manually enter "/studio", an additional layer of security.
//  4. If access token does not checks out, then it calls the database for administration table and checks email and password against it.
//  5. If email and password checks out, it generate a new secret text, saves that text in the db and generate a new accessToken for the page.
//  6. If email and password don't check out, it gives an error.

// Do note that there is NO option of creating a new table for administration, nor there is one to update the table. The only way it can be updates is by manually accessing the database and updating information. (adding new authorized profile or changing password etc).

export async function POST(request: NextRequest) {
  const req = await request.json();
  const accessToken = request.cookies.get("accessToken")?.value;
  console.log("the accesstoken: ", accessToken);

  const origin = request.headers.get('origin')

  // limiter defined below

  const remaining = await adminLimiter.removeTokens(1)
  console.log('remaining: ', remaining)

  if (remaining < 0) {
    return new NextResponse(null, {
      status: 429,
      statusText: "Too Many Requests",
      headers : {
        'Access=Control-Allow-Origin': origin || '*',
        'Content-Type': 'text/plain'
      }
    })
  }

  if (accessToken) {
    try {
      const { verifiedJwt } = await (
        await fetch(request.nextUrl.origin + "/api/auth", {
          method: "post",
          body: JSON.stringify({ accessToken }),
        })
      )
        // calling the '/auth API'
        .json();
      console.log("this is the verifiedJwt", verifiedJwt);
      if (verifiedJwt) {
        console.log("success");
        // if success, redirects you to the /studio page
        return NextResponse.redirect(request.nextUrl.origin + "/studio");
      }
    } catch (err) {
      console.log("access denied");
      // alert("access denied");
      return NextResponse.redirect(process.env.WEBSITE_DOMAIN as string);
    }
  }

  // The data will pick all the environmental variables itself. No need to define each of them here as was with previous package.

  console.log("this is the request: ", req);
  let { adminEmailAddress, adminPassword }: Req = req;
  // adminEmailAddress = adminEmailAddress.toLowerCase();

  // Calls email and password data from database. If email is not available, will return a next response with 'notfound' error.
  const dataFromTable = (
    await db
      .select()
      .from(administrationauthoritytable)
      .where(eq(administrationauthoritytable.email, adminEmailAddress))
  )[0];

  // Handling if email doesn't axist.
  if (!dataFromTable) {
    console.log("email not found.");
    request.cookies.delete("accessToken");
    return new NextResponse(
      "Please enter valid email address for Admin access",
      {
        status: errorCodes.notFound,
      }
    );
  }

  try {
    // If email and password is found. The following will check they match the database.
    const { email, password } = dataFromTable;
    console.log("this is data from Table: ", dataFromTable);

    if (email === adminEmailAddress && password === adminPassword) {
      const secrettext = uuidv4();

      await db
        .update(administrationauthoritytable)
        .set({ secrettext: secrettext })
        .where(eq(administrationauthoritytable.email, adminEmailAddress));

      let payload = {
        email: adminEmailAddress,
      };
      // If successful, the code will then make a new jwt token from a nealy generated secrettext and save it in the database.
      const accessToken = jwtSign(
        {
          payload: payload,
        },
        secrettext,
        {
          expiresIn: "24h", // expires in 24 hours
        }
      );

      const response = NextResponse.json({ accessToken });
      response.cookies.set({
        name: "accessToken",
        value: accessToken,
        httpOnly: true,
      });
      console.log("administration successfully run");

      return response;
      // return NextResponse.json({ message: "Logged In Successfully" });
    } else {
      throw new Error("Email/password required.");
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: (error as { message: string }).message,
    });
  }
}
