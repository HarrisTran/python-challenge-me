import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { z } from 'zod';

const ParamSchema = z.object({
  name: z.string(),
  type: z.string(),
});

const ExampleSchema = z.object({
  args: z.array(z.any()),
  output: z.any(),
  explanation: z.string().optional(),
});

const TestCaseSchema = z.object({
  args: z.array(z.any()),
  output: z.any(),
});

const ProblemSchema = z.object({
  id: z.string().regex(/^\d{4}$/, "ID phải là 4 chữ số (ví dụ: 0001)"),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).optional(),
  params: z.array(ParamSchema).min(1),
  returnType: z.string().min(1),
  examples: z.array(ExampleSchema).min(1),
  testCases: z.array(TestCaseSchema).length(20, "Phải có đúng 20 test cases"),
  starterCode: z.string().optional(),
  compare: z.enum(["exact", "float", "unordered"]).optional().default("exact"),
  epsilon: z.number().optional(),
  timeLimitMs: z.number().optional().default(3000),
  source: z.object({
    name: z.string(),
    url: z.string(),
    license: z.literal("MIT"),
  }).optional(),
});

const problemsDir = path.resolve('content/problems');
const solutionsDir = path.resolve('content/solutions');
const harnessPath = path.resolve('scripts/harness.py');

if (!fs.existsSync(problemsDir)) {
  console.error(`Thư mục ${problemsDir} không tồn tại.`);
  process.exit(1);
}

const files = fs.readdirSync(problemsDir).filter(f => f.endsWith('.json')).sort();
console.log(`Bắt đầu kiểm tra ${files.length} bài tập...`);

const slugs = new Set<string>();
const ids = new Set<string>();

let hasError = false;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(problemsDir, file);
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  let data: any;

  try {
    data = JSON.parse(rawContent);
  } catch (err: any) {
    console.error(`❌ [${file}] Lỗi phân tích cú pháp JSON:`, err.message);
    hasError = true;
    continue;
  }

  // 1. Zod schema validation
  const parseResult = ProblemSchema.safeParse(data);
  if (!parseResult.success) {
    console.error(`❌ [${file}] Sai cấu trúc schema:`, parseResult.error.format());
    hasError = true;
    continue;
  }

  const prob = parseResult.data;

  // Kiểm tra trùng ID và Slug
  if (ids.has(prob.id)) {
    console.error(`❌ [${file}] Trùng ID: ${prob.id}`);
    hasError = true;
  }
  ids.add(prob.id);

  if (slugs.has(prob.slug)) {
    console.error(`❌ [${file}] Trùng slug: ${prob.slug}`);
    hasError = true;
  }
  slugs.add(prob.slug);

  // Số lượng args phải khớp params
  for (let t = 0; t < prob.testCases.length; t++) {
    const tc = prob.testCases[t];
    if (tc.args.length !== prob.params.length) {
      console.error(`❌ [${file}] Test case #${t + 1} có ${tc.args.length} tham số, nhưng params khai báo ${prob.params.length}`);
      hasError = true;
    }
  }

  // Kiểm tra trùng lặp args giữa các test
  const argStrings = new Set<string>();
  for (let t = 0; t < prob.testCases.length; t++) {
    const serialized = JSON.stringify(prob.testCases[t].args);
    if (argStrings.has(serialized)) {
      console.error(`❌ [${file}] Test case #${t + 1} bị trùng lặp args: ${serialized}`);
      hasError = true;
    }
    argStrings.add(serialized);
  }

  // 2. Kiểm tra lời giải mẫu bằng Python harness
  const solPath = path.join(solutionsDir, `${prob.id}.py`);
  if (!fs.existsSync(solPath)) {
    console.error(`❌ [${file}] Thiếu file lời giải mẫu: ${solPath}`);
    hasError = true;
    continue;
  }

  try {
    const cmd = `python3 "${harnessPath}" "${solPath}" "${filePath}"`;
    const resOutput = execSync(cmd, { encoding: 'utf-8' });
    const res = JSON.parse(resOutput.trim());
    if (!res.passed) {
      console.error(`❌ [${file}] Lời giải kiểm chứng thất bại:`, res.error || res);
      hasError = true;
    } else {
      console.log(`✅ [${prob.id}] ${prob.title} (20/20 tests passed)`);
    }
  } catch (err: any) {
    console.error(`❌ [${file}] Lỗi khi chạy harness Python:`, err.stdout || err.message);
    hasError = true;
  }
}

if (hasError) {
  console.error("\n❌ Có lỗi xảy ra trong quá trình validate!");
  process.exit(1);
} else {
  console.log("\n🎉 Toàn bộ bài tập và lời giải đã được kiểm chứng thành công 100%!");
}
