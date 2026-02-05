import { NextResponse } from "next/server";
import mysql from 'mysql2/promise'

export async function POST(req: Request) {
   try {
      const { config, tableName, targetDatabase } = await req.json();
      console.log("🚀 ~ POST ~ tableName:", tableName);
      const connection = await mysql.createConnection(
         {
            host: config.host,
            user: config.user,
            password: config.password,
            database: targetDatabase || config.database,
            port: Number(config.port),
            rowsAsArray: false,
            supportBigNumbers: true,
            decimalNumbers: true,
         });

      const [rows]: any = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      console.log("🚀 ~ POST ~ rows:", rows);
      await connection.end();

      const ddl = rows[0]['Create Table'] + ';';

      return NextResponse.json({ ddl });

   } catch (error: any) {
      console.log("🚀 ~ POST ~ error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 })
   }
}