"use client";
import Image from "next/image";
import { useState } from "react";

export function AccountProfile({ email, name, picture }: {
  email: string;
  name?: string;
  picture?: string;
}) {
  const [failedPicture, setFailedPicture] = useState<string>();
  const initials = (name || email).split(/\s+/).slice(0, 2)
    .map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
  return (
    <div className="account">
      <span className="account-avatar" aria-hidden="true">
        {picture && picture !== failedPicture ? (
          <Image src={picture} alt="" width={48} height={48} unoptimized
            referrerPolicy="no-referrer" onError={() => setFailedPicture(picture)} />
        ) : initials}
      </span>
      <div className="account-details">
        {name ? <span className="account-name">{name}</span> : null}
        <span className="account-email">{email}</span>
      </div>
    </div>
  );
}
