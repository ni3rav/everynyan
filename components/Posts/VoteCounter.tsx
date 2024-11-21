"use client";

import {
  downvoteCommentAction,
  downvotePostAction,
  upvoteCommentAction,
  upvotePostAction,
} from "@/lib/actions/upvoteDownvote";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function VoteCounter({
  upVotes,
  downVotes,
  postID,
  commentID,
}: {
  upVotes: number;
  downVotes: number;
  postID: string;
  commentID?: string;
}) {
  const [currentUpVotes, setCurrentUpVotes] = useState(upVotes);
  const [currentDownVotes, setCurrentDownVotes] = useState(downVotes);
  const [isUpVoted, setUpVoted] = useState(false);
  const [isDownVoted, setDownVoted] = useState(false);

  let isComment = false;
  let storageVotePrefix = "post";
  if (commentID) {
    isComment = true;
    storageVotePrefix = "comment";
  }

  const setLocalStorageVote = (vote: "upvoted" | "downvoted" | "none") => {
    localStorage.setItem(
      `${storageVotePrefix}-vote-${isComment ? commentID : postID}`,
      vote
    );
  };

  // todo localStorage can be easily manipulated by the user, so this is not a secure way to store vote status, consider using a server side solution
  // Load vote status from local storage on component mount
  useEffect(() => {
    const storedVote = localStorage.getItem(
      `${storageVotePrefix}-vote-${isComment ? commentID : postID}`
    );
    if (storedVote === "upvoted") setUpVoted(true);
    if (storedVote === "downvoted") setDownVoted(true);
  }, []);

  const upvoteRequest = async () => {
    const upvotePromise = isComment
      ? upvoteCommentAction(postID, commentID!, isUpVoted)
      : upvotePostAction(postID, isUpVoted);
    const resp = await upvotePromise;
    if (resp.error) {
      console.error(resp.error);
      // Revert on failure
      setUpVoted((prev) => !prev);
      setCurrentUpVotes((prev) => prev + (isUpVoted ? 1 : -1));
      if (isDownVoted) {
        setDownVoted(true);
        setCurrentDownVotes((prev) => prev + 1);
      }
      setLocalStorageVote(isUpVoted ? "upvoted" : "none");
    }
  };

  const downvoteRequest = async () => {
    const downvotePromise = isComment
      ? downvoteCommentAction(postID, commentID!, isDownVoted)
      : downvotePostAction(postID, isDownVoted);
    const resp = await downvotePromise;
    if (resp.error) {
      console.error(resp.error);
      // Revert on failure
      setDownVoted((prev) => !prev);
      setCurrentDownVotes((prev) => prev + (isDownVoted ? 1 : -1));
      if (isUpVoted) {
        setUpVoted(true);
        setCurrentUpVotes((prev) => prev + 1);
      }
      setLocalStorageVote(isDownVoted ? "downvoted" : "none");
    }
  };

  const handleVote = async (vote: "up" | "down") => {
    if (vote === "up") {
      if (isUpVoted) {
        // Undo upvote
        setUpVoted(false);
        setCurrentUpVotes((prev) => prev - 1);
        setLocalStorageVote("none");
      } else {
        // Perform upvote
        setUpVoted(true);
        setCurrentUpVotes((prev) => prev + 1);
        if (isDownVoted) {
          setDownVoted(false);
          setCurrentDownVotes((prev) => prev - 1);
          await downvoteRequest();
        }
        setLocalStorageVote("upvoted");
      }
      await upvoteRequest();
    } else if (vote === "down") {
      if (isDownVoted) {
        // Undo downvote
        setDownVoted((prev) => !prev);
        setCurrentDownVotes((prev) => prev - 1);
        setLocalStorageVote("none");
      } else {
        // Perform downvote
        setDownVoted(true);
        setCurrentDownVotes((prev) => prev + 1);
        if (isUpVoted) {
          setUpVoted((prev) => !prev);
          setCurrentUpVotes((prev) => prev - 1);
          await upvoteRequest();
        }
        setLocalStorageVote("downvoted");
      }
      await downvoteRequest();
    }
  };

  return (
    <div className="rounded-3xl p-2 flex gap-2 sm:gap-2 justify-between items-center bg-primary/10 text-white/40">
      <div className="flex justify-center w-max h-max cursor-pointer">
        <ArrowBigUp
          className={`mr-1 size-6 ${
            !isDownVoted && isUpVoted ? " fill-emerald-500 text-emerald-500" : "fill-none"
          }`}
          onClick={() => handleVote("up")}
        />
        <span className="h-full flex justify-center font-semibold items-center text-base">
          {currentUpVotes}
        </span>
      </div>
      <div className="flex w-[1px] h-5 bg-white/40 justify-center items-center " />
      <div className="flex  justify-start cursor-pointer w-max h-max">
        <span className="h-full flex justify-center items-center font-semibold text-xs sm:text-base">
          {currentDownVotes}
        </span>
        <ArrowBigDown
          className={`ml-1 size-6  ${
            isDownVoted && !isUpVoted ? "fill-rose-500 text-rose-500" : ""
          }`}
          onClick={() => handleVote("down")}
        />
      </div>
    </div>
  );
}
