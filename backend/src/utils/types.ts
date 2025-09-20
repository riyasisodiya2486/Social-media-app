import {z} from "zod";

const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
];

export const signupSchema = z.object({
    email: z.email().min(13),
    username: z.string().min(4).max(20),
    password: z.string().min(6).max(20)
})

export const signInSchemga = z.object({
    username: z.string().min(4).max(20),
    password: z.string().min(6).max(20)
})

export const userProfile = z.object({
    fullname: z.string(),
    bio: z.string().min(10).max(120).optional(),
    profileImage: z.string().optional(),
})

export const postSchema = z.object({
    image: z.any().refine(
            (file) => file instanceof File,
            "Image file is require"
        ).refine(
            (file)=> ACCEPTED_IMAGE_TYPES.includes(file.type),
            "unsupported image format"
        ),
    caption: z.string().max(200).optional()
})

