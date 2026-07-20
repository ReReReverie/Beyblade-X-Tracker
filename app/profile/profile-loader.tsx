"use client";

import ProfileClient from "./profile-client-minimal";

type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

export function ProfileClientLoader(props: { initialData: any; initialTab: ProfileTab; sessionName?: string | null }) {
  return <ProfileClient {...props} />;
}
