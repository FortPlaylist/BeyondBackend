import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

const { CLIENT_SECRET } = BeyondConfiguration;

export function verifyTokenAPI(token: string) {
  try {
    const decoded = jwt.verify(token, CLIENT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export function bValidUsername(input: string): string[] {
  const regex = /[^a-zA-Z0-9\s]/g;
  const disallowedCharacters = input.match(regex);

  const filteredDisallowedCharacters = disallowedCharacters
    ? disallowedCharacters.filter((char) => char !== " ")
    : [];
  return filteredDisallowedCharacters;
}
