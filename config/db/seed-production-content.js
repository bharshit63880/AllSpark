const targetDb = db.getSiblingDB("allSpark");

const adminUser =
  targetDb.users.findOne({ email: "admin@example.com" }) ||
  targetDb.users.findOne({ user_name: "admin" });

if (!adminUser) {
  throw new Error("admin user not found. Create/login admin@example.com first.");
}

const adminId = String(adminUser._id);

const supportedLanguageIds = [63, 71, 62, 52, 54];

const cloneCases = (cases) => cases.map((c) => ({ ...c }));

const makeMultiLangCases = (publicCases, privateCases) =>
  supportedLanguageIds.map((languageId) => ({
    language_id: languageId,
    public_test_cases: cloneCases(publicCases),
    private_test_cases: cloneCases(privateCases),
  }));

const makeCase = (
  id,
  stdin,
  expected_output,
  cpu_time_limit = 2,
  memory_limit = 128000,
  stack_limit = 128000
) => ({
  id: String(id),
  stdin: String(stdin),
  expected_output: String(expected_output),
  cpu_time_limit,
  memory_limit,
  stack_limit,
});

print("[Seed] Clearing existing contest/problem related data...");
targetDb.participants.deleteMany({});
targetDb.submissions.deleteMany({});
targetDb.contests.deleteMany({});
targetDb.problems.deleteMany({});

const problems = [
  {
    name: "Two Sum (Return Indices)",
    slug: "two-sum-return-indices",
    tags: ["array", "hash-map", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nGiven an array nums of length n and an integer target, return the indices of two distinct elements whose sum is exactly target.\n\nInput Format:\n- First line: n target\n- Second line: n space-separated integers\n\nOutput Format:\n- Print two indices i j (0-based) such that i < j and nums[i] + nums[j] = target\n- Print -1 -1 if no valid pair exists\n\nConstraints:\n- 2 <= n <= 2 * 10^5\n- -10^9 <= nums[i], target <= 10^9\n- Exactly one valid answer may or may not exist\n\nExample:\nInput:\n4 9\n2 7 11 15\nOutput:\n0 1",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4 9\n2 7 11 15", "0 1"),
        makeCase("2", "5 11\n1 3 4 6 7", "2 4"),
      ],
      [
        makeCase("11", "6 18\n5 8 1 2 11 7", "4 5"),
        makeCase("12", "3 100\n1 2 3", "-1 -1"),
        makeCase("13", "5 9\n4 5 2 6 1", "0 1"),
      ]
    ),
  },
  {
    name: "Valid Parentheses",
    slug: "valid-parentheses",
    tags: ["stack", "string", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nGiven a string s containing only the characters '(', ')', '{', '}', '[' and ']', determine whether the brackets are balanced.\n\nInput Format:\n- Single line string s\n\nOutput Format:\n- Print true if s is valid, else print false\n\nConstraints:\n- 1 <= s.length <= 2 * 10^5\n- s contains only ()[]{}\n\nRules:\n- Every opening bracket must be closed by the same type\n- Brackets must close in the correct order\n\nExample:\nInput:\n([{}])\nOutput:\ntrue",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "()[]{}", "true"),
        makeCase("2", "(]", "false"),
      ],
      [
        makeCase("11", "([{}])", "true"),
        makeCase("12", "(((()", "false"),
        makeCase("13", "{[()]}", "true"),
      ]
    ),
  },
  {
    name: "Binary Search First Occurrence",
    slug: "binary-search-first-occurrence",
    tags: ["binary-search", "array", "easy"],
    difficulty: "easy",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nYou are given a non-decreasing sorted array arr of length n and a target x. Return the first index where x appears.\n\nInput Format:\n- First line: n x\n- Second line: n sorted integers\n\nOutput Format:\n- Print the first index of x\n- Print -1 if x does not exist\n\nConstraints:\n- 1 <= n <= 2 * 10^5\n- -10^9 <= arr[i], x <= 10^9\n- Expected complexity: O(log n)\n\nExample:\nInput:\n7 2\n1 2 2 2 3 4 5\nOutput:\n1",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "7 2\n1 2 2 2 3 4 5", "1"),
        makeCase("2", "5 8\n1 3 5 7 9", "-1"),
      ],
      [
        makeCase("11", "6 10\n10 10 10 10 11 12", "0"),
        makeCase("12", "8 6\n1 2 3 4 5 6 7 8", "5"),
        makeCase("13", "4 1\n1 1 1 1", "0"),
      ]
    ),
  },
  {
    name: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating",
    tags: ["string", "sliding-window", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nGiven a string s, find the length of the longest substring without repeating characters.\n\nInput Format:\n- Single line string s\n\nOutput Format:\n- Single integer representing the maximum length\n\nConstraints:\n- 0 <= s.length <= 2 * 10^5\n- s may contain letters, digits, symbols and spaces\n- Expected complexity: O(n)\n\nExample:\nInput:\npwwkew\nOutput:\n3\nExplanation:\nThe longest substring without repetition is 'wke'.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "abcabcbb", "3"),
        makeCase("2", "bbbbb", "1"),
      ],
      [
        makeCase("11", "pwwkew", "3"),
        makeCase("12", "dvdf", "3"),
        makeCase("13", "anviaj", "5"),
      ]
    ),
  },
  {
    name: "Maximum Subarray Sum",
    slug: "maximum-subarray-sum",
    tags: ["array", "dynamic-programming", "medium"],
    difficulty: "medium",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nGiven an integer array nums, find the contiguous subarray with the largest sum and return that sum.\n\nInput Format:\n- First line: n\n- Second line: n space-separated integers\n\nOutput Format:\n- Single integer: maximum subarray sum\n\nConstraints:\n- 1 <= n <= 2 * 10^5\n- -10^5 <= nums[i] <= 10^5\n- Expected complexity: O(n)\n\nExample:\nInput:\n9\n-2 1 -3 4 -1 2 1 -5 4\nOutput:\n6\nExplanation:\nSubarray [4, -1, 2, 1] has the largest sum.",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "9\n-2 1 -3 4 -1 2 1 -5 4", "6"),
        makeCase("2", "5\n1 2 3 4 5", "15"),
      ],
      [
        makeCase("11", "6\n-1 -2 -3 -4 -5 -6", "-1"),
        makeCase("12", "8\n5 -2 3 4 -1 2 -1 6", "16"),
        makeCase("13", "1\n7", "7"),
      ]
    ),
  },
  {
    name: "Number of Islands",
    slug: "number-of-islands-grid",
    tags: ["graph", "dfs", "bfs", "hard"],
    difficulty: "hard",
    is_public: true,
    created_by: adminId,
    description:
      "Problem Statement:\nYou are given a 2D grid of '0's (water) and '1's (land). Count the number of islands.\nAn island is formed by connecting adjacent lands horizontally or vertically.\n\nInput Format:\n- First line: r c\n- Next r lines: binary strings of length c\n\nOutput Format:\n- Single integer: total number of islands\n\nConstraints:\n- 1 <= r, c <= 300\n- grid[i][j] is either 0 or 1\n\nExample:\nInput:\n4 5\n11000\n11000\n00100\n00011\nOutput:\n3",
    test_cases: makeMultiLangCases(
      [
        makeCase("1", "4 5\n11000\n11000\n00100\n00011", "3"),
        makeCase("2", "3 3\n111\n010\n111", "1"),
      ],
      [
        makeCase("11", "5 5\n11011\n10001\n00100\n10101\n11111", "3"),
        makeCase("12", "2 4\n0000\n0000", "0"),
        makeCase("13", "1 1\n1", "1"),
      ]
    ),
  },
];

const problemInsertResult = targetDb.problems.insertMany(problems);
const insertedProblemIds = Object.values(problemInsertResult.insertedIds).map((id) =>
  String(id)
);

const slugToId = {};
targetDb.problems
  .find({}, { slug: 1 })
  .toArray()
  .forEach((p) => {
    slugToId[p.slug] = String(p._id);
  });

const now = new Date();
const liveStart = new Date(now.getTime() - 30 * 60 * 1000);
const liveEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
const upcomingStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
const upcomingEnd = new Date(upcomingStart.getTime() + 3 * 60 * 60 * 1000);
const endedStart = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
const endedEnd = new Date(endedStart.getTime() + 2 * 60 * 60 * 1000);

const contests = [
  {
    name: "March Challenge Live 2026",
    slug: "march-challenge-live-2026",
    description:
      "Live rated contest focused on arrays, strings, and graph fundamentals. Tie-break by earliest accepted submission.",
    created_by: adminId,
    support_team: ["support@allspark.com", "judge-ops@allspark.com"],
    problems: [
      slugToId["two-sum-return-indices"],
      slugToId["valid-parentheses"],
      slugToId["maximum-subarray-sum"],
      slugToId["number-of-islands-grid"],
    ],
    start_time: liveStart,
    end_time: liveEnd,
    duration: liveEnd.getTime() - liveStart.getTime(),
    support_end_time: new Date(liveEnd.getTime() + 24 * 60 * 60 * 1000),
  },
  {
    name: "April Sprint 2026",
    slug: "april-sprint-2026",
    description:
      "Fast-paced 3-hour sprint with implementation-heavy problems and strict runtime constraints.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["binary-search-first-occurrence"],
      slugToId["longest-substring-without-repeating"],
      slugToId["maximum-subarray-sum"],
    ],
    start_time: upcomingStart,
    end_time: upcomingEnd,
    duration: upcomingEnd.getTime() - upcomingStart.getTime(),
    support_end_time: new Date(upcomingEnd.getTime() + 24 * 60 * 60 * 1000),
  },
  {
    name: "Archived Weekly #12",
    slug: "archived-weekly-12",
    description:
      "Archived weekly contest for practice and leaderboard replay analysis.",
    created_by: adminId,
    support_team: ["support@allspark.com"],
    problems: [
      slugToId["two-sum-return-indices"],
      slugToId["binary-search-first-occurrence"],
      slugToId["number-of-islands-grid"],
    ],
    start_time: endedStart,
    end_time: endedEnd,
    duration: endedEnd.getTime() - endedStart.getTime(),
    support_end_time: new Date(endedEnd.getTime() + 24 * 60 * 60 * 1000),
  },
];

targetDb.contests.insertMany(contests);

print("[Seed] Production content seeded successfully.");
printjson({
  users: targetDb.users.countDocuments(),
  problems: targetDb.problems.countDocuments(),
  contests: targetDb.contests.countDocuments(),
  participants: targetDb.participants.countDocuments(),
  submissions: targetDb.submissions.countDocuments(),
  seededProblemIds: insertedProblemIds,
});
