import {NextRequest, NextResponse} from 'next/server';
import {admin} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const {idToken} = await request.json();

  if (!idToken) {
    return NextResponse.json({error: 'ID token is required'}, {status: 400});
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, {expiresIn});
    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const response = NextResponse.json({status: 'success'});
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      {error: 'Failed to create session'},
      {status: 401}
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({status: 'success'});
  response.cookies.set('__session', '', {maxAge: 0});
  return response;
}
