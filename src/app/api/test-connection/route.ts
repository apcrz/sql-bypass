import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
   try {
      const body = await req.json();
      const { host, user, password, database, port } = body;

      const connection = await mysql.createConnection({
         host,
         user,
         password,
         database,
         port: Number(port),
      });

      await connection.end();

      return NextResponse.json({ success: true });
   } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
   }
}
