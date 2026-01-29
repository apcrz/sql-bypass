// @/app/api/schema/route.ts

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
   let connection;
   try {
      const config = await request.json();

      connection = await mysql.createConnection({
         host: config.host,
         user: config.user,
         password: config.password,
         port: Number(config.port),
         connectTimeout: 5000
      });

      const [rows] = await connection.execute(`
      SELECT table_schema as dbName, table_name as tableName 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
      ORDER BY table_schema, table_name
    `);

      const tree = (rows as any[]).reduce((acc: any, row: any) => {
         if (!acc[row.dbName]) acc[row.dbName] = [];
         acc[row.dbName].push(row.tableName);
         return acc;
      }, {});

      const schema = Object.keys(tree).map(db => ({
         name: db,
         tables: tree[db]
      }));
      console.log("🚀 ~ POST ~ schema:", schema);

      await connection.end();
      return NextResponse.json({ data: schema });

   } catch (error: any) {
      if (connection) await connection.end();
      return NextResponse.json({ error: error.message }, { status: 500 });
   }
}