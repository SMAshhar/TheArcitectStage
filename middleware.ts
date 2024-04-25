import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedPaths } from "./utils/protectedPath";

// This is middleware. It will take in every possible path and:
// 1. Check if there is an accessToken stored in the cookies. 
// 2. Check if the link is in the "protectedPaths" from the file "./utils/protectedPath".
// 3. if it is not, it will let the user pass to the said path. 
// 4. If the path is in the "protectedPaths", but accessToken is not available, it will redirect the user to "home" page.
// 5. If the path is in the "protectedPaths", and accessToken is also available, it will varify the accessToken.
// 6. If the accessToken cannot be verified, it will redirect the user to "home" page.
// 7. If the accessToken is verified, it will redirect the user to the "protectedPath". 

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const accessToken = request.cookies.get("accessToken")?.value;
  console.log('the accesstoken: ',accessToken)

  console.log("this is the requested url:", request.nextUrl.pathname);
 if (!protectedPaths.includes(request.nextUrl.pathname)) {
  // Checking if path is not protected.
    return NextResponse.next();
  } else if (protectedPaths.includes(request.nextUrl.pathname) && accessToken) {
// check if:
// 1. path in protectedPath.
// 2. accessToken available.
    console.log("url from middlware: ", request.nextUrl.origin);
    try {
      const { verifiedJwt } = await (
        await fetch(request.nextUrl.origin + "/api/auth", {
          method: "post",
          body: JSON.stringify({ accessToken }),
        })
      ).json();
      if (!verifiedJwt) {
        const response = new NextResponse(
          JSON.stringify({ success: false, message: "auth failed" }),
          { status: 401, headers: { "content-type": "application/json" } }
        );
        response.cookies.set("accessToken", "", {
          expires: new Date(Date.now()),
        });
        return NextResponse.redirect(new URL("/", request.url));
      }

      requestHeaders.set("verifiedJwt", JSON.stringify(verifiedJwt.payload));

      return NextResponse.next();
    } catch (err) {
      console.log("err ", err);
      const response = new NextResponse(
        JSON.stringify({ success: false, message: "auth failed from catch" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
      response.cookies.delete("accessToken");
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    const response = new NextResponse(
      JSON.stringify({ success: false, message: "auth failed from catch" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    response.cookies.delete("accessToken");
    return NextResponse.redirect(new URL("/", request.url));
  }

}

export const config = {
  matcher: ["/studio/:path*"],
};

const unAutherizedPaths = ["/studio"];

const extraRoutes = [
  "/_next",
  "/imgs",
  "/favicon.ico",
  "/studio",
  "/api/administration/",
];
