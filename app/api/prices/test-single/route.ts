import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FMP_API_KEY = '9ERUMtxQIBjyPwr5hTMVKSG9irnMBdin';

export async function POST(request: NextRequest) {
 try {
   const { symbol } = await request.json();
   
   const response = await fetch(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${FMP_API_KEY}`);
   const data = await response.json();
   const price = data[0]?.price;
   
   if (price) {
     await prisma.holdings.updateMany({
       where: { symbol },
       data: {
         currentUnitPrice: price,
         priceUpdated: new Date(),
         priceSource: 'fmp'
       }
     });
   }
   
   return NextResponse.json({ 
     symbol,
     oldPrice: "520 (Alpha Vantage fallback)",
     newPrice: price,
     updated: !!price,
     apiCallsUsed: 1
   });
 } catch (error) {
   return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
 }
}
