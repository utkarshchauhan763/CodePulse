const mongoose = require("mongoose");
const problemService = require("../src/services/problemService");
const testCaseService = require("../src/services/testCaseService");
const submissionService = require("../src/services/submissionService");
const Problem = require("../src/models/Problem");
const TestCase = require("../src/models/TestCase");
const Submission = require("../src/models/Submission");

jest.mock("mongoose", () => ({
  isValidObjectId: jest.fn()
}));

jest.mock("../src/models/Problem", () => ({
  findOne: jest.fn(),
  findById: jest.fn()
}));

jest.mock("../src/models/TestCase", () => ({
  find: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/models/Submission", () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn()
}));

describe("service validation for malformed ids and hidden data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("problemService rejects malformed ObjectIds before querying the database", async () => {
    mongoose.isValidObjectId.mockReturnValue(false);
    await expect(problemService.getProblemById("abc")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid problem ID"
    });
    expect(Problem.findOne).not.toHaveBeenCalled();
    expect(TestCase.find).not.toHaveBeenCalled();
  });

  test("testCaseService rejects malformed ObjectIds before querying the database", async () => {
    mongoose.isValidObjectId.mockReturnValue(false);
    await expect(testCaseService.getTestCases("bad")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid problem ID"
    });
    expect(Problem.findById).not.toHaveBeenCalled();
    expect(TestCase.find).not.toHaveBeenCalled();
  });

  test("submissionService rejects malformed submission ids before querying ownership", async () => {
    mongoose.isValidObjectId.mockReturnValue(false);
    await expect(submissionService.getSubmissionById("bad", "507f1f77bcf86cd799439011")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid submission ID"
    });
    expect(Submission.findOne).not.toHaveBeenCalled();
  });

  test("problemService hides hidden test cases from the public endpoint", async () => {
    mongoose.isValidObjectId.mockReturnValue(true);
    const problem = { _id: "507f1f77bcf86cd799439011", title: "Sum", isActive: true };
    Problem.findOne.mockResolvedValue(problem);
    TestCase.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { input: "1 2", expectedOutput: "3", points: 5 }
        ])
      })
    });

    const result = await problemService.getProblemById("507f1f77bcf86cd799439011");
    expect(TestCase.find).toHaveBeenCalledWith({
      problem: "507f1f77bcf86cd799439011",
      isHidden: false
    });
    expect(result.problem).toEqual(problem);
    expect(result.testCases).toHaveLength(1);
  });
});
