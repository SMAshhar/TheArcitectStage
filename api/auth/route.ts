import { NextRequest, NextResponse } from "next/server";
import { decode, verify } from "jsonwebtoken";
import { db, administrationauthoritytable } from "../../../lib/drizzle";
import { eq } from "drizzle-orm";
import { authLimiter } from "../config/limiter";

// This API will take accessToken as request. It will:
//  1. Decode token built as JWT token
//  2. Check if the "email" from the decoded token is in database.
//  3. If it is, take the "secrettext" saved in the database and verify the token with this "secrettext"
//  4. If it is verified, it allows the visitor to access the page. Otherwise, it will deny request.

export async function POST(request: NextRequest) {
  const req = await request.json();
  let accessToken = req.accessToken;

  const origin = request.headers.get("origin")

    // limiter defined below

    const remaining = await authLimiter.removeTokens(1);
    console.log("remaining: ", remaining);
  
    if (remaining < 0) {
      return new NextResponse(null, {
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          "Access=Control-Allow-Origin": origin || "*",
          "Content-Type": "text/plain",
        },
      });
    }

  console.log("accesstokken from auth api", accessToken);

  const decodedToken: any = decode(accessToken); // 1. Decoded the token
  console.log(
    "This is the decodedToken.payload.email",
    decodedToken.payload.email
  );
  if (!decodedToken) {
    return new Response("Error during decoding access token.", {
      status: 401,
    });
  }
  console.log("decoded token successful");
  const adminsecrettext = (
    await db
      .select()
      .from(administrationauthoritytable)
      .where(eq(administrationauthoritytable.email, decodedToken.payload.email))
  )[0];

  // 2. Check if the "email" from the decoded token is in database.
  console.log("adminsecrettext: ", adminsecrettext.secrettext);

  if (!adminsecrettext || !adminsecrettext.secrettext) {
    return new Response(
      "Please enter valid admin email address for Admin access.",
      {
        status: 401,
      }
    );
  }
  try {
    var verifiedJwt: any = verify(accessToken, adminsecrettext.secrettext);
    // 3. If it is, take the "secrettext" saved in the database and varify the token with this "secrettext"
    console.log("varified succesfull from auth api.");
    return NextResponse.json({ verifiedJwt });
  } catch (err) {
    // 4. If it is varified, it allows the visiter to access the page. Otherwise, it will denie request.
    const response = new NextResponse(
      JSON.stringify({ success: false, message: "auth failed" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    response.cookies.delete("accessToken");
    return response;
  }
}
