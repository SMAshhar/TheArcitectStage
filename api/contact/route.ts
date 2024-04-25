import { QueryResult, sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import { db, contactTable } from "@/lib/drizzle";
import { contactLimiter } from "../config/limiter";
import { Metadata } from "next";

// This POST API will take data from the "Lets Make Something Unique Together." form and :
// 1. Check the Databast, if the table named "contact" is not created yet, it will create a table carrying columns for : 
//    a. id (used as a serial key. Will generate automatically for every new entry.)
//    b. name (from the name field with maximum length of 255 characters.)
//    c. email (from the email field. The email format will be checked within the form at front-end.)
//    d. subject (from subject field with maximum length of 255 characters.)
//    e. description (from the description field with maximum length of 255 characters. )
//    f. date (the function will generate the date time via the built-in function Date().)
// 2. Once the data table named "contact" at the database is verified, the API will forward the request to the database,
//    which inturn will save this information in the said table.
// NOTE: The GET API is also coded if ever needed to access the data from the "contact" table via front-end.

export async function GET() {

  // limiter defined below

  const remaining = await contactLimiter.removeTokens(1);
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
    await sql`CREATE TABLE IF NOT EXISTS contact(id SERIAL, name VARCHAR(255), email VARCHAR(255) NOT NULL, subject VARCHAR(255), description VARCHAR(255), date DATE)`;
    const res = await db.select().from(contactTable);

    return NextResponse.json({ result: res });
  } catch (error) {
    console.log((error as { message: string }).message);
    // good practice to only get the error message.

    return NextResponse.json({ message: "Something went wrong." });
  }
}


export async function POST(request: NextRequest) {
  const req = await request.json(); 
  // will pick all the envs it self. No need to define each of them here as was with previous package adding additional security layer.

  const origin = request.headers.get("origin");

  // limiter defined below

  const remaining = await contactLimiter.removeTokens(1);
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

      await sql`CREATE TABLE IF NOT EXISTS contact(id SERIAL, name VARCHAR(255), email VARCHAR(255) NOT NULL, subject VARCHAR(255), description VARCHAR(255), date DATE)`;
      const res = db
        .insert(contactTable)
        .values({
          name: req.name,
          email: req.email,
          subject:req.subject,
          date: datetime.toDateString(),
          description: req.description,
        })
        .execute();

      return NextResponse.json({
        message:
          "We have recieved your query, we will contact you as soon as we can.",
      });
    } else {
      throw new Error("Data required.");
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: (error as { message: string }).message,
    });
  }
}
