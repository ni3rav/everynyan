import "@/app/scrollbar.css";
import PerPost from "@/components/Posts/PostView/PerPost";
import { getPostComments } from "@/lib/firebase/comments";
import { getPostByID } from "@/lib/firebase/posts";
import { notFound } from "next/navigation";
import Comments from "../Comments";
import { convertTimestamp } from "@/lib/utils";

async function PostView({
  postID,
  isAdmin,
}: {
  postID: string;
  isAdmin: boolean;
}) {
  const post = await getPostByID(postID);
  if (!post || (post.moderation_status == "rejected" && !isAdmin)) {
    return notFound();
  }
  const comments = await getPostComments(postID);
  const formattedComments = comments.map((comment) => ({
    ...comment,
    timestamp: convertTimestamp(comment.timestamp),
  }));

  return (
    <main className="min-h-[92vh] grid grid-cols-1 md:grid-cols-5 gap-2">
      <div className="md:col-span-5">
        <div className="flex flex-col h-full px-1 md:px-4 gap-4">
          {/* Post */}
          <div className="flex-shrink-0 md:p-0 px-2 py-3">
            <PerPost
              boardName={post.board}
              content={post.body}
              title={post.title}
              upVotes={post.upvotes}
              downVotes={post.downvotes}
              id={post.id}
            />
          </div>

          {/* Comments */}
          <div className="flex-grow overflow-auto everynyan-scroll">
            <Comments postID={postID} initialComments={formattedComments} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default PostView;
