/**
 * Realistic sample data reflecting Kiro IDE export structure
 * Session UUID: 0a211842-55e7-4c2d-a54c-f4c9d83c0009
 * Sub-executions: 10cc3eba-214c-4cf2-9108-f7118ef5b332, aa3f8ba7-a561-4083-85df-a05db18d329d, d78f119d-0629-4c78-8619-7c03426f1673
 */

export const sampleSessionJson = JSON.stringify(
  {
    sessionId: "0a211842-55e7-4c2d-a54c-f4c9d83c0009",
    title: "Implement User Authentication & JWT Refresh Flow",
    createdAt: "2025-05-14T08:30:00.000Z",
    updatedAt: "2025-05-14T08:42:15.000Z",
    workspace: "ecommerce-backend-api",
    model: "claude-3-7-sonnet-thought",
  },
  null,
  2
);

export const sampleMainMessagesJsonl = [
  JSON.stringify({
    id: "msg-main-001",
    role: "user",
    content: "We need to implement JWT authentication with refresh tokens in our Express API. Can you review our auth routes and database schema?",
    timestamp: "2025-05-14T08:30:00.000Z",
  }),
  JSON.stringify({
    id: "msg-main-002",
    role: "assistant",
    thinking: "The user needs JWT authentication with access + refresh token mechanics. Let me check the directory structure first, then spawn sub-agents to inspect existing DB schema and auth controllers in parallel.",
    content: "I will help you implement the JWT authentication and refresh token system. Let me first inspect the current repository structure and analyze your existing user models and route handlers.",
    tool_calls: [
      {
        id: "call-001",
        name: "list_directory",
        input: { path: "src" },
      },
    ],
    timestamp: "2025-05-14T08:30:15.000Z",
  }),
  JSON.stringify({
    id: "msg-main-003",
    role: "tool",
    tool_use_id: "call-001",
    name: "list_directory",
    content: "src/\n├── controllers/\n│   └── authController.ts\n├── middleware/\n├── models/\n│   └── User.ts\n├── routes/\n│   └── auth.ts\n└── server.ts",
    timestamp: "2025-05-14T08:30:18.000Z",
  }),
  JSON.stringify({
    id: "msg-main-004",
    role: "assistant",
    content: "I can see `src/controllers/authController.ts` and `src/models/User.ts`. I am launching a sub-agent to audit `User.ts` for refresh token columns and hash methods, while another sub-agent inspects `authController.ts`.",
    timestamp: "2025-05-14T08:30:25.000Z",
  }),
  JSON.stringify({
    id: "msg-main-005",
    role: "assistant",
    content: "Both sub-agents have completed their investigations:\n\n1. **User Model**: Missing `refreshTokenHash` and `tokenVersion` columns.\n2. **Auth Controller**: Currently signs 24-hour access tokens without any refresh mechanism or revocation capability.\n\nNow I will update the User schema and implement `/api/auth/refresh` and `/api/auth/logout` endpoints.",
    timestamp: "2025-05-14T08:35:40.000Z",
  }),
  JSON.stringify({
    id: "msg-main-006",
    role: "user",
    content: "Great! Please make sure refresh tokens are stored in an httpOnly secure cookie so client JavaScript cannot access them.",
    timestamp: "2025-05-14T08:36:10.000Z",
  }),
  JSON.stringify({
    id: "msg-main-007",
    role: "assistant",
    thinking: "Configuring httpOnly cookies with `sameSite: 'strict'` and `secure: process.env.NODE_ENV === 'production'`. Spawning a sub-agent to verify tests pass after implementation.",
    content: "Here is the implementation plan:\n\n```typescript\nres.cookie('refreshToken', token, {\n  httpOnly: true,\n  secure: process.env.NODE_ENV === 'production',\n  sameSite: 'strict',\n  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days\n});\n```\n\nI will now write the test suite and run verification.",
    timestamp: "2025-05-14T08:36:50.000Z",
  }),
  JSON.stringify({
    id: "msg-main-008",
    role: "assistant",
    content: "All test cases have passed! The JWT refresh token rotation pattern is now fully active with secure `httpOnly` cookie handling, token versioning for instant revocation, and automated blacklisting.",
    timestamp: "2025-05-14T08:42:15.000Z",
  }),
].join("\n");

export const sampleSubExecution1 = [
  JSON.stringify({
    id: "sub1-001",
    role: "user",
    content: "Sub-agent task: Inspect `src/models/User.ts` and report on existing password hash fields, token fields, and indexes.",
    timestamp: "2025-05-14T08:30:30.000Z",
  }),
  JSON.stringify({
    id: "sub1-002",
    role: "assistant",
    thinking: "Reading `src/models/User.ts` to examine schema definition.",
    content: "Inspecting User model definition...",
    tool_calls: [
      {
        id: "call-sub1-1",
        name: "read_file",
        input: { path: "src/models/User.ts" },
      },
    ],
    timestamp: "2025-05-14T08:30:35.000Z",
  }),
  JSON.stringify({
    id: "sub1-003",
    role: "tool",
    tool_use_id: "call-sub1-1",
    name: "read_file",
    content: "export interface IUser {\n  id: string;\n  email: string;\n  passwordHash: string;\n  createdAt: Date;\n}",
    timestamp: "2025-05-14T08:30:40.000Z",
  }),
  JSON.stringify({
    id: "sub1-004",
    role: "assistant",
    content: "**Audit Result:** `User.ts` currently only has `id`, `email`, `passwordHash`, and `createdAt`. We need to add `refreshTokenHash?: string` and `tokenVersion: number`.",
    timestamp: "2025-05-14T08:31:10.000Z",
  }),
].join("\n");

export const sampleSubExecution2 = [
  JSON.stringify({
    id: "sub2-001",
    role: "user",
    content: "Sub-agent task: Inspect `src/controllers/authController.ts` and summarize current login / token issuance logic.",
    timestamp: "2025-05-14T08:30:32.000Z",
  }),
  JSON.stringify({
    id: "sub2-002",
    role: "assistant",
    content: "Reviewing `src/controllers/authController.ts`...",
    tool_calls: [
      {
        id: "call-sub2-1",
        name: "read_file",
        input: { path: "src/controllers/authController.ts" },
      },
    ],
    timestamp: "2025-05-14T08:30:45.000Z",
  }),
  JSON.stringify({
    id: "sub2-003",
    role: "tool",
    tool_use_id: "call-sub2-1",
    name: "read_file",
    content: "export const login = async (req, res) => {\n  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });\n  res.json({ token });\n};",
    timestamp: "2025-05-14T08:30:52.000Z",
  }),
  JSON.stringify({
    id: "sub2-004",
    role: "assistant",
    content: "**Audit Result:** Current controller generates a single 24-hour JWT token sent in response body. Needs split into 15-minute access token + 7-day refresh token in cookie.",
    timestamp: "2025-05-14T08:31:30.000Z",
  }),
].join("\n");

export const sampleSubExecution3 = [
  JSON.stringify({
    id: "sub3-001",
    role: "user",
    content: "Sub-agent task: Run test suite `npm test auth.test.ts` to confirm new refresh cookie endpoints.",
    timestamp: "2025-05-14T08:38:00.000Z",
  }),
  JSON.stringify({
    id: "sub3-002",
    role: "assistant",
    content: "Executing test suite...",
    tool_calls: [
      {
        id: "call-sub3-1",
        name: "execute_command",
        input: { command: "npm test auth.test.ts" },
      },
    ],
    timestamp: "2025-05-14T08:38:15.000Z",
  }),
  JSON.stringify({
    id: "sub3-003",
    role: "tool",
    tool_use_id: "call-sub3-1",
    name: "execute_command",
    content: "PASS src/tests/auth.test.ts\n  ✓ should return 401 when refresh token cookie missing (42 ms)\n  ✓ should issue new access token with valid refresh token (85 ms)\n  ✓ should revoke all refresh tokens on version mismatch (64 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       3 passed, 3 total\nSnapshots:   0 total\nTime:        1.24s",
    timestamp: "2025-05-14T08:38:40.000Z",
  }),
  JSON.stringify({
    id: "sub3-004",
    role: "assistant",
    content: "Verification successful: All 3 authentication tests passed with full coverage of refresh token rotation and revocation.",
    timestamp: "2025-05-14T08:39:00.000Z",
  }),
].join("\n");

export function getSampleFiles(): { path: string; content: string; size: number }[] {
  const root = "0a211842-55e7-4c2d-a54c-f4c9d83c0009";
  return [
    {
      path: `${root}/session.json`,
      content: sampleSessionJson,
      size: sampleSessionJson.length,
    },
    {
      path: `${root}/messages.jsonl`,
      content: sampleMainMessagesJsonl,
      size: sampleMainMessagesJsonl.length,
    },
    {
      path: `${root}/sub-executions/10cc3eba-214c-4cf2-9108-f7118ef5b332.jsonl`,
      content: sampleSubExecution1,
      size: sampleSubExecution1.length,
    },
    {
      path: `${root}/sub-executions/aa3f8ba7-a561-4083-85df-a05db18d329d.jsonl`,
      content: sampleSubExecution2,
      size: sampleSubExecution2.length,
    },
    {
      path: `${root}/sub-executions/d78f119d-0629-4c78-8619-7c03426f1673.jsonl`,
      content: sampleSubExecution3,
      size: sampleSubExecution3.length,
    },
  ];
}
