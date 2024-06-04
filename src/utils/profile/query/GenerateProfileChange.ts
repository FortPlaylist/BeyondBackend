import { v4 as uuid } from "uuid";

interface ProfileChange {
  changeType: string;
  _id: string;
  profile: any;
}

export default async function GenerateProfileChange(
  changeType: string,
  profileData: any,
): Promise<ProfileChange[]> {
  return new Promise((resolve, reject) => {
    try {
      const profileChange: ProfileChange = {
        changeType,
        _id: uuid().replace(/-/gi, ""),
        profile: { ...profileData },
      };

      resolve([profileChange]);
    } catch (error) {
      reject(error);
    }
  });
}
