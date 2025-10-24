export interface GitStatus {
  // Current branch information
  current?: string; // Name of current branch (e.g., "main", "master")
  tracking?: string; // Name of upstream branch being tracked (e.g., "origin/main")

  // Ahead/Behind information
  ahead?: number; // Number of commits ahead of remote
  behind?: number; // Number of commits behind remote

  // File status arrays
  staged?: string[]; // Files staged for commit
  not_added?: string[]; // Untracked files (files not yet added to git)
  created?: string[]; // New files added to git but not committed
  modified?: string[]; // Files that have been modified but not staged
  deleted?: string[]; // Files that have been deleted but not staged
  conflicted?: string[]; // Files with merge conflicts

  // Detailed file status
  files?: Array<{
    path: string; // File path
    index: string; // Status in index (staging area)
    working_dir: string; // Status in working directory
  }>;

  // Helper methods
  isClean?: boolean; // Returns true if working directory is clean

  // Raw status data
  detached?: boolean; // True if in detached HEAD state
}

export interface GiApiResponse {
  success: boolean;
  data?: GitStatus;
  error?: string;
}

export interface GitLogResponse {
  success: boolean;
  data?: {
    commits: {
      hash: string;
      date: string;
      message: string;
      refs: string;
      body: string;
      author_name: string;
      author_email: string;
    }[];
  };
  error?: string;
}
