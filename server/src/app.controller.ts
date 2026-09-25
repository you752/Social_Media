
import express, { Request, Response } from "express";
import authRouter from "./module/auth/auth.controller";
import cors from "cors";
import helmet from "helmet";
import { generalRateLimit } from "./common/middleware/rateLimit/rateLimit";
import { env } from "./config/env.service";
import { connectDB } from "./database/connectionMongo";
import { connectRS } from "./database/connenctionRedius";
import { globalErrorHandler } from "./common/middleware/errorhandling/globalHandler";
import userRouter from "./module/user/user.controller";
import friendRouter from "./module/friend/friend.controller";
import commentRouter from "./module/comment/comment.controller";
import postRouter from "./module/post/post.controller";
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "./module/gql/schema.gql";
import { realtimeModule } from "./module/realtime/realtime.module";
import chatRouter from "./module/chat/chat.controller";
import adminRouter from "./module/admin/admin.controller";

const bootstrap = async () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: true,
    }),
  );

  //app.use(generalRateLimit);
  app.use(helmet({ crossOriginResourcePolicy: false }));

  await connectDB();
  await connectRS();

  // app.all("/graphql", createHandler({ schema: schema, context: (req) => ({ req }) }));

  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/friend", friendRouter);
  app.use("/comment", commentRouter);
  app.use("/post", postRouter);
  app.use("/chat", chatRouter);
  app.use("/admin", adminRouter);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  app.use(globalErrorHandler);

  const httpServer = app.listen(
    Number(env.port) || 8000,
    "0.0.0.0",
    () => {
      console.log("server is running");
    },
  );

  realtimeModule.initialize(httpServer);
};

export default bootstrap;

