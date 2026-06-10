import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

export const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const getOwnerAvatar = (ownerName: string, index: number = 0) => {
    if (!ownerName) return null;
    const lower = ownerName.toLowerCase();
    if (lower.includes("duncan")) return avatar2;
    if (lower.includes("mcgrady")) return avatar4;
    if (lower.includes("allen")) return avatar1;
    if (lower.includes("haslem")) return avatar3;
    return ALL_AVATARS[index % ALL_AVATARS.length];
};
