import type { Comment as CommentType, DBComment } from "@/lib/models";
import { db } from "./app";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { generateCommentID } from "../utils";

export async function addComment(postID: string, commentBody: string, level: number, parentID: string | null) {
  try {
    const batch = db.batch()
    const commentID = generateCommentID()
    const comment: CommentType = {
      id: commentID,
      body: commentBody,
      level: level,
      upvotes: 0,
      downvotes: 0,
      parent_id: parentID,
      moderation_status: "pending"
    }

    const postRef = db.collection("posts").doc(postID)
    const commentsRef = db.collection("posts").doc(postID).collection("comments").doc(commentID)

    const dbComment = {
      ...comment,
      timestamp: Timestamp.now()
    }
    batch.set(commentsRef, dbComment)

    batch.update(postRef, {
      comment_count: FieldValue.increment(1)
    })

    await batch.commit()
    return dbComment
  } catch (e) {
    console.error("error in adding comment", e)
  }

}

export async function getPostComments(postID: string) {
  const commentsRef = db.collection("posts").
    doc(postID).
    collection("comments").
    where("moderation_status", "!=", "rejected")

  const commentsSnap = await commentsRef.get()

  const comments: DBComment[] = []
  commentsSnap.forEach((comment) => {
    comments.push(comment.data() as DBComment)
  })

  return comments
}

async function voteComment(postID: string, commentID: string, undo: boolean, field: "upvotes" | "downvotes") {
  const commentRef = db.collection("posts").doc(postID).collection("comments").doc(commentID)
  try {
    await commentRef.update({
      [field]: FieldValue.increment(undo ? -1 : 1)
    })
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export async function upvoteComment(postID: string, commentID: string, undo: boolean) {
  return await voteComment(postID, commentID, undo, "upvotes")
}

export async function downvoteComment(postID: string, commentID: string, undo: boolean) {
  return await voteComment(postID, commentID, undo, "downvotes")
}

export async function updateCommentModerationStatus(postID: string, commentID: string, newStatus: "approved" | "rejected") {
  try {
    const docRef = db.collection("posts").doc(postID).collection("comments").doc(commentID)
    await docRef.update({
      "moderation_status": newStatus
    })
    return true
  } catch (e) {
    console.error("error in update comment moderation status", e)
    return false
  }
}
