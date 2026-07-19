/**
 * Session initialization API route
 * Creates and sets session cookie
 */

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE_NAME = 'docuintel_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST() {
  const sessionId = uuidv4();
  
  const response = NextResponse.json({ sessionId });
  
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return response;
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to create session' }, { status: 405 });
}
