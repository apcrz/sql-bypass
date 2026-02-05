import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(req: Request) {
   try {
      const { config, tableName, targetDatabase } = await req.json();

      const dbConfig = { ...config, database: targetDatabase || config.database };

      const connection = await mysql.createConnection(dbConfig);

      const sql = `
         SELECT 
            COLUMN_NAME as col, 
            REFERENCED_TABLE_NAME as refTable, 
            REFERENCED_COLUMN_NAME as refCol
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE 
            TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL;
      `;

      const [rows]: any = await connection.execute(sql, [dbConfig.database, tableName]);
      await connection.end();

      const relations: Record<string, any> = {};
      rows.forEach((row: any) => {
         relations[row.col] = { table: row.refTable, col: row.refCol };
      });

      return NextResponse.json({ relations });
   } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }
}