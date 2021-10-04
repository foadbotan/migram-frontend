import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useSession, signOut } from "next-auth/client";
import styled from "styled-components";

import ButtonStyles from "../styles/ButtonStyles";
import UserIconStyles from "../styles/UserIconStyles";
import DropDownStyles from "../styles/DropDownStyles";

const NavStyles = styled.ul`
  margin: 1rem 0 1rem 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  justify-self: end;
  gap: 2rem;
  font-weight: 500;
  text-transform: lowercase;
  a {
    margin: 1rem;
  }
`;

export default function Nav() {
  const [session, loading]: any = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSignout(e: any) {
    e.preventDefault();
    const data: any = await signOut({ redirect: false, callbackUrl: "/login" });
    if (data.url) {
      router.push(data.url);
    }
  }

  return (
    <NavStyles>
      {loading && <></>}
      {session && (
        <>
          <UserIconStyles onClick={() => setIsOpen(!isOpen)}>
            {/* TODO: Remove/change placeholder */}
            {session.user.photo ? (
              <Image
                width="48px"
                height="48px"
                src={
                  session.user.photo
                    ? session.user.photo
                    : "https://www.w3schools.com/howto/img_avatar.png"
                }
                alt="Avatar"
              />
            ) : (
              <Image
                width="48px"
                height="48px"
                // src={`${process.env.NEXT_PUBLIC_API_URL}${session.user.photo}`}
                src="https://www.w3schools.com/howto/img_avatar.png"
                alt="Avatar"
              />
            )}
          </UserIconStyles>
          {isOpen && (
            <DropDownStyles>
              <Link href="/account" passHref>
                <a onClick={() => setIsOpen(false)}>Account</a>
              </Link>
              <a
                onClick={(e) => {
                  setIsOpen(false);
                  handleSignout(e);
                }}
              >
                Logout
              </a>
            </DropDownStyles>
          )}
        </>
      )}
      {!session && !loading && (
        <>
          <Link href="/login" passHref>
            <ButtonStyles>Login</ButtonStyles>
          </Link>
          <Link href="/signup" passHref>
            <ButtonStyles primary>Sign up</ButtonStyles>
          </Link>
        </>
      )}
    </NavStyles>
  );
}
