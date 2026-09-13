export type Difficulty = "Easy" | "Medium" | "Hard";
export type DsaTopic =
  | "Arrays"
  | "Strings"
  | "Searching"
  | "Sorting"
  | "Linked List"
  | "Stack"
  | "Queue"
  | "Trees"
  | "Graphs"
  | "Dynamic Programming";

export type StarterCode = { c: string; cpp: string; java: string; python: string };

export type TestCase = { stdin: string; expected: string };

export type DsaProblem = {
  slug: string;
  title: string;
  topic: DsaTopic;
  difficulty: Difficulty;
  statement: string;
  starter: StarterCode;
  tests: TestCase[];
};

const io = {
  c: `#include <stdio.h>\n\nint main(void) {\n    // Read input, print output\n    return 0;\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input, print output\n    return 0;\n}\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input, print output\n    }\n}\n`,
  python: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # Read input, print output\n\nif __name__ == "__main__":\n    main()\n`,
};

export const DSA_PROBLEMS: DsaProblem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "Easy",
    statement:
      "Given an array of `n` integers and a target `t`, print the 0-indexed positions `i j` (i < j) such that `arr[i] + arr[j] == t`. Assume exactly one solution exists.\n\n**Input**\n```\nn\narr[0] arr[1] ... arr[n-1]\nt\n```\n**Output**\n```\ni j\n```",
    starter: io,
    tests: [
      { stdin: "4\n2 7 11 15\n9\n", expected: "0 1" },
      { stdin: "3\n3 2 4\n6\n", expected: "1 2" },
      { stdin: "2\n3 3\n6\n", expected: "0 1" },
    ],
  },
  {
    slug: "max-subarray-sum",
    title: "Maximum Subarray Sum",
    topic: "Arrays",
    difficulty: "Medium",
    statement:
      "Given `n` integers, print the maximum sum of a contiguous subarray (Kadane's algorithm).\n\n**Input**\n```\nn\narr[0]...arr[n-1]\n```\n**Output**\n```\nmax sum\n```",
    starter: io,
    tests: [
      { stdin: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expected: "6" },
      { stdin: "1\n1\n", expected: "1" },
      { stdin: "5\n-1 -2 -3 -4 -5\n", expected: "-1" },
    ],
  },
  {
    slug: "product-except-self",
    title: "Product of Array Except Self",
    topic: "Arrays",
    difficulty: "Medium",
    statement:
      "Given `n` integers, print an array where each element is the product of all other elements (no division).\n\n**Input**\n```\nn\narr\n```\n**Output**\n```\nspace separated result\n```",
    starter: io,
    tests: [
      { stdin: "4\n1 2 3 4\n", expected: "24 12 8 6" },
      { stdin: "3\n2 3 4\n", expected: "12 8 6" },
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    topic: "Arrays",
    difficulty: "Medium",
    statement:
      "Given `n` intervals `[s e]`, merge all overlapping intervals and print them sorted by start.\n\n**Input**\n```\nn\ns1 e1\ns2 e2\n...\n```\n**Output**\n```\none merged interval per line: s e\n```",
    starter: io,
    tests: [
      { stdin: "4\n1 3\n2 6\n8 10\n15 18\n", expected: "1 6\n8 10\n15 18" },
      { stdin: "2\n1 4\n4 5\n", expected: "1 5" },
    ],
  },
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    topic: "Strings",
    difficulty: "Easy",
    statement:
      "Given two strings on separate lines, print `YES` if they are anagrams of each other, else `NO`.",
    starter: io,
    tests: [
      { stdin: "anagram\nnagaram\n", expected: "YES" },
      { stdin: "rat\ncar\n", expected: "NO" },
    ],
  },
  {
    slug: "longest-substring-no-repeat",
    title: "Longest Substring Without Repeating Characters",
    topic: "Strings",
    difficulty: "Medium",
    statement: "Given a string, print the length of the longest substring without repeating characters.",
    starter: io,
    tests: [
      { stdin: "abcabcbb\n", expected: "3" },
      { stdin: "bbbbb\n", expected: "1" },
      { stdin: "pwwkew\n", expected: "3" },
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    topic: "Strings",
    difficulty: "Easy",
    statement: "Given a string of brackets `()[]{}`, print `YES` if it is balanced, else `NO`.",
    starter: io,
    tests: [
      { stdin: "()[]{}\n", expected: "YES" },
      { stdin: "(]\n", expected: "NO" },
      { stdin: "([)]\n", expected: "NO" },
    ],
  },
  {
    slug: "string-to-integer",
    title: "Implement atoi",
    topic: "Strings",
    difficulty: "Medium",
    statement:
      "Convert a string to a 32-bit signed integer, following typical atoi rules (skip leading whitespace, optional sign, digits until non-digit). Print the resulting integer.",
    starter: io,
    tests: [
      { stdin: "   -42\n", expected: "-42" },
      { stdin: "4193 with words\n", expected: "4193" },
      { stdin: "words and 987\n", expected: "0" },
    ],
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    topic: "Searching",
    difficulty: "Easy",
    statement:
      "Given a sorted array of `n` integers and a target `t`, print the index of `t` (0-indexed) or `-1` if not present.",
    starter: io,
    tests: [
      { stdin: "6\n-1 0 3 5 9 12\n9\n", expected: "4" },
      { stdin: "6\n-1 0 3 5 9 12\n2\n", expected: "-1" },
    ],
  },
  {
    slug: "search-rotated-array",
    title: "Search in Rotated Sorted Array",
    topic: "Searching",
    difficulty: "Medium",
    statement:
      "Given a rotated sorted array of distinct integers and a target, print its index, or -1 if absent, in O(log n).",
    starter: io,
    tests: [
      { stdin: "7\n4 5 6 7 0 1 2\n0\n", expected: "4" },
      { stdin: "7\n4 5 6 7 0 1 2\n3\n", expected: "-1" },
    ],
  },
  {
    slug: "kth-smallest",
    title: "Kth Smallest Element",
    topic: "Searching",
    difficulty: "Medium",
    statement: "Given `n` integers and `k`, print the kth smallest element (1-indexed).",
    starter: io,
    tests: [
      { stdin: "6\n7 10 4 3 20 15\n3\n", expected: "7" },
      { stdin: "5\n1 2 3 4 5\n1\n", expected: "1" },
    ],
  },
  {
    slug: "sort-colors",
    title: "Sort Colors (Dutch National Flag)",
    topic: "Sorting",
    difficulty: "Medium",
    statement:
      "Given `n` integers each 0, 1, or 2, sort them in-place (conceptually) and print the sorted array space separated.",
    starter: io,
    tests: [
      { stdin: "6\n2 0 2 1 1 0\n", expected: "0 0 1 1 2 2" },
      { stdin: "3\n2 0 1\n", expected: "0 1 2" },
    ],
  },
  {
    slug: "merge-sort",
    title: "Merge Sort",
    topic: "Sorting",
    difficulty: "Medium",
    statement: "Given `n` integers, print them sorted ascending using merge sort.",
    starter: io,
    tests: [
      { stdin: "5\n5 3 4 1 2\n", expected: "1 2 3 4 5" },
      { stdin: "1\n1\n", expected: "1" },
    ],
  },
  {
    slug: "kth-largest-heap",
    title: "Kth Largest Element",
    topic: "Sorting",
    difficulty: "Medium",
    statement: "Given `n` integers and `k`, print the kth largest element (1-indexed) using sorting or a heap.",
    starter: io,
    tests: [
      { stdin: "6\n3 2 1 5 6 4\n2\n", expected: "5" },
      { stdin: "9\n3 2 3 1 2 4 5 5 6\n4\n", expected: "4" },
    ],
  },
  {
    slug: "reverse-linked-list",
    title: "Reverse a Linked List",
    topic: "Linked List",
    difficulty: "Easy",
    statement:
      "Given `n` integers representing a singly linked list in order, print the values after reversing the list.",
    starter: io,
    tests: [
      { stdin: "5\n1 2 3 4 5\n", expected: "5 4 3 2 1" },
      { stdin: "2\n1 2\n", expected: "2 1" },
    ],
  },
  {
    slug: "detect-cycle-linked-list",
    title: "Detect Cycle in Linked List",
    topic: "Linked List",
    difficulty: "Medium",
    statement:
      "Given `n` node values and `pos` (0-indexed index the tail connects to, or -1 for no cycle), print `YES` if the list has a cycle, else `NO`. Build the list logically using pos to simulate the cycle without infinite reading (use it only to decide the answer via Floyd's algorithm reasoning, or output directly based on pos != -1 after implementing safely).",
    starter: io,
    tests: [
      { stdin: "3\n3 2 0\n1\n", expected: "YES" },
      { stdin: "1\n1\n-1\n", expected: "NO" },
    ],
  },
  {
    slug: "merge-two-sorted-lists",
    title: "Merge Two Sorted Linked Lists",
    topic: "Linked List",
    difficulty: "Easy",
    statement:
      "Given two sorted linked lists (each: n then values), print the merged sorted list values space separated.",
    starter: io,
    tests: [
      { stdin: "3\n1 2 4\n3\n1 3 4\n", expected: "1 1 2 3 4 4" },
      { stdin: "0\n\n0\n\n", expected: "" },
    ],
  },
  {
    slug: "min-stack",
    title: "Min Stack Operations",
    topic: "Stack",
    difficulty: "Medium",
    statement:
      "Process `n` operations: `push x`, `pop`, `top`, `getMin`. For `top` and `getMin`, print the result on its own line.",
    starter: io,
    tests: [
      {
        stdin: "6\npush -2\npush 0\npush -3\ngetMin\npop\ngetMin\n",
        expected: "-3\n-2",
      },
    ],
  },
  {
    slug: "next-greater-element",
    title: "Next Greater Element",
    topic: "Stack",
    difficulty: "Medium",
    statement:
      "Given `n` integers, for each element print the next greater element to its right, or -1 if none, space separated.",
    starter: io,
    tests: [
      { stdin: "4\n2 1 2 4\n", expected: "4 2 4 -1" },
      { stdin: "3\n1 2 3\n", expected: "2 3 -1" },
    ],
  },
  {
    slug: "evaluate-rpn",
    title: "Evaluate Reverse Polish Notation",
    topic: "Stack",
    difficulty: "Medium",
    statement:
      "Given `n` space-separated tokens of an RPN expression (integers and + - * /), print the evaluated integer result (integer division truncates toward zero).",
    starter: io,
    tests: [
      { stdin: "5\n2 1 + 3 *\n", expected: "9" },
      { stdin: "5\n4 13 5 / +\n", expected: "6" },
    ],
  },
  {
    slug: "queue-using-stacks",
    title: "Implement Queue using Stacks",
    topic: "Queue",
    difficulty: "Easy",
    statement:
      "Process `n` operations: `push x`, `pop`, `peek`. For `pop` and `peek`, print the result.",
    starter: io,
    tests: [
      { stdin: "5\npush 1\npush 2\npeek\npop\npeek\n", expected: "1\n1\n2" },
    ],
  },
  {
    slug: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    topic: "Queue",
    difficulty: "Hard",
    statement:
      "Given `n` integers and window size `k`, print the maximum of each sliding window of size k, space separated.",
    starter: io,
    tests: [
      { stdin: "8\n1 3 -1 -3 5 3 6 7\n3\n", expected: "3 3 5 5 6 7" },
      { stdin: "1\n1\n1\n", expected: "1" },
    ],
  },
  {
    slug: "level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    topic: "Trees",
    difficulty: "Easy",
    statement:
      "Given `n` values in level-order with `-1` for null nodes (building a binary tree), print the level-order traversal values (excluding nulls) space separated, level by level.",
    starter: io,
    tests: [
      { stdin: "7\n3 9 20 -1 -1 15 7\n", expected: "3 9 20 15 7" },
      { stdin: "1\n1\n", expected: "1" },
    ],
  },
  {
    slug: "validate-bst",
    title: "Validate Binary Search Tree",
    topic: "Trees",
    difficulty: "Medium",
    statement:
      "Given `n` values in level-order (`-1` = null) building a binary tree, print `YES` if it is a valid BST, else `NO`.",
    starter: io,
    tests: [
      { stdin: "3\n2 1 3\n", expected: "YES" },
      { stdin: "5\n5 1 4 -1 -1 3 6\n", expected: "NO" },
    ],
  },
  {
    slug: "lowest-common-ancestor",
    title: "Lowest Common Ancestor in BST",
    topic: "Trees",
    difficulty: "Medium",
    statement:
      "Given `n` values in level-order (`-1` = null) building a BST, and two values `p q`, print the value of their lowest common ancestor.",
    starter: io,
    tests: [
      { stdin: "7\n6 2 8 0 4 7 9\n2 8\n", expected: "6" },
      { stdin: "7\n6 2 8 0 4 7 9\n2 4\n", expected: "2" },
    ],
  },
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    topic: "Graphs",
    difficulty: "Medium",
    statement:
      "Given a grid of `r` rows and `c` cols of 0/1, print the number of islands (connected groups of 1s, 4-directionally).\n\n**Input**\n```\nr c\nrow0\nrow1\n...\n```\n(each row is a string of 0/1 without spaces)",
    starter: io,
    tests: [
      { stdin: "4 5\n11110\n11010\n11000\n00000\n", expected: "1" },
      { stdin: "4 5\n11000\n11000\n00100\n00011\n", expected: "3" },
    ],
  },
  {
    slug: "course-schedule",
    title: "Course Schedule (Cycle Detection)",
    topic: "Graphs",
    difficulty: "Medium",
    statement:
      "Given `n` courses and `m` prerequisite pairs `a b` (must take b before a), print `YES` if it's possible to finish all courses (no cycle), else `NO`.",
    starter: io,
    tests: [
      { stdin: "2 1\n1 0\n", expected: "YES" },
      { stdin: "2 2\n1 0\n0 1\n", expected: "NO" },
    ],
  },
  {
    slug: "shortest-path-bfs",
    title: "Shortest Path in Unweighted Graph",
    topic: "Graphs",
    difficulty: "Medium",
    statement:
      "Given `n` nodes (0-indexed), `m` undirected edges `a b`, and source `s` and destination `d`, print the shortest path length (number of edges), or -1 if unreachable.",
    starter: io,
    tests: [
      { stdin: "5 4\n0 1\n1 2\n2 3\n3 4\n0 4\n", expected: "4" },
      { stdin: "3 1\n0 1\n0 2\n", expected: "1" },
    ],
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    topic: "Dynamic Programming",
    difficulty: "Easy",
    statement:
      "Given `n` stairs, where you can climb 1 or 2 steps at a time, print the number of distinct ways to reach the top.",
    starter: io,
    tests: [
      { stdin: "2\n", expected: "2" },
      { stdin: "5\n", expected: "8" },
    ],
  },
  {
    slug: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    statement: "Given two strings on separate lines, print the length of their longest common subsequence.",
    starter: io,
    tests: [
      { stdin: "abcde\nace\n", expected: "3" },
      { stdin: "abc\ndef\n", expected: "0" },
    ],
  },
  {
    slug: "coin-change",
    title: "Coin Change (Minimum Coins)",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    statement:
      "Given `n` coin denominations and a target amount, print the minimum number of coins needed to make the amount, or -1 if impossible.",
    starter: io,
    tests: [
      { stdin: "3\n1 2 5\n11\n", expected: "3" },
      { stdin: "1\n2\n3\n", expected: "-1" },
    ],
  },
  {
    slug: "0-1-knapsack",
    title: "0/1 Knapsack",
    topic: "Dynamic Programming",
    difficulty: "Hard",
    statement:
      "Given `n` items each with weight and value, and capacity `W`, print the maximum total value achievable without exceeding capacity.\n\n**Input**\n```\nn W\nw1 v1\nw2 v2\n...\n```",
    starter: io,
    tests: [
      { stdin: "3 50\n10 60\n20 100\n30 120\n", expected: "220" },
      { stdin: "1 10\n5 10\n", expected: "10" },
    ],
  },
];

export const DSA_TOPICS: DsaTopic[] = [
  "Arrays",
  "Strings",
  "Searching",
  "Sorting",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Dynamic Programming",
];

export function problemBySlug(slug: string): DsaProblem | undefined {
  return DSA_PROBLEMS.find((p) => p.slug === slug);
}

export function problemsByTopic(): Record<DsaTopic, DsaProblem[]> {
  const grouped = {} as Record<DsaTopic, DsaProblem[]>;
  for (const t of DSA_TOPICS) grouped[t] = [];
  for (const p of DSA_PROBLEMS) grouped[p.topic].push(p);
  return grouped;
}
