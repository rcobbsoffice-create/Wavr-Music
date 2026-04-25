import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "audio/mpeg",
          "audio/wav",
          "audio/flac",
          "audio/aiff",
          "audio/ogg",
          "audio/mp4",
          "audio/x-wav",
          "audio/x-aiff",
        ],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
