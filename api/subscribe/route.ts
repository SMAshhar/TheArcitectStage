import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import { db, subscribeTable } from "@/lib/drizzle";
import { subscribeLimiter } from "../config/limiter";

// This POST API is will take in the email provided by the subscribe component on the "/about" page and:
// 1. Checks if the database has the table named "subscribed".
// 2. If there is not table named "subscribed", it creates a new table with columns :
//    a. id (used as a serial key. Will generate automatically for every new entry.)
//    b. email (from the email field. The email format will be checked within the form at front-end. This will be a unique field.)
//    c. date (the function will generate the date time via the built-in function Date().)
// 3. Once the table is varified, it the API will check if the provided email is already in the database.
// 4. If it exists. It will do nothing and a success toast will be shown on the page.
// 5. If it doesn't exist, the API will make a new entry for the said email and a success toast will be shown on the page.
//  NOTE: The GET API is also coded if ever needed to access the data from the "subscribed" table via front-end.

export async function GET() {
  // limiter defined below

  const remaining = await subscribeLimiter.removeTokens(1);
  console.log("remaining: ", remaining);

  if (remaining < 0) {
    return new NextResponse(null, {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "Access=Control-Allow-Origin": "*",
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    // table is usually made one time on the DB. But what if there is none, it will make a new one here.
    await sql`CREATE TABLE IF NOT EXISTS subscribed(id SERIAL, email VARCHAR(255) UNIQUE NOT NULL, joined_at DATE`;
    const res = await db.select().from(subscribeTable);

    // const all = await sql`SELECT * FROM SUBSCRIBED`;

    return NextResponse.json({ result: res });
  } catch (error) {
    console.log((error as { message: string }).message);
    // good practice to only get the error message.

    return NextResponse.json({ message: "Something went wrong." });
  }
}

export async function POST(request: NextRequest) {
  const req = await request.json(); //will pick all the envs it self. No need to define each of them here as was with previous package.

  const origin = request.headers.get("origin");

  // limiter defined below

  const remaining = await subscribeLimiter.removeTokens(1);
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

  const datetime = new Date();
  console.log(datetime.toDateString());
  try {
    if (req.email) {
      await sql`CREATE TABLE IF NOT EXISTS subscribed(id SERIAL, email VARCHAR(255) UNIQUE NOT NULL, joined_at DATE);`;
      const res = db
        .insert(subscribeTable)
        .values({
          email: req.email,
          joined_at: datetime.toDateString(),
        })
        .execute();

      return NextResponse.json({ message: "Email added Successfully" });
    } else {
      throw new Error("Email required.");
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: (error as { message: string }).message,
    });
  }
}
