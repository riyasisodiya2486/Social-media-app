import { Router } from "express";
import { upload } from "../middleware/multer";
import { middleware } from "../middleware/middleware";
import { deleteStory, uploadStory, viewStory } from "../controller/storyController";

const route = Router();

route.post('/uploadstories', upload.single('media'), middleware, uploadStory);
route.delete('/:id', middleware, deleteStory);
route.get('/:id/view', middleware, viewStory);

export default route;