import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
   let connection;
   try {
      const { config, sql } = await request.json();

      if (!sql) throw new Error("Query vazia");

      connection = await mysql.createConnection({
         host: config.host,
         user: config.user,
         password: config.password,
         database: config.database, // Importante: conectar no banco certo
         port: Number(config.port),
         rowsAsArray: false,
         supportBigNumbers: true, // Evita perda de precisão
         decimalNumbers: true,
      });

      const [rows] = await connection.execute(sql);

      await connection.end();
      return NextResponse.json({ data: rows });

   } catch (error: any) {
      if (connection) await connection.end();
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
   }
}