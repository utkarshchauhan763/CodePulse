const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const authMiddleware = require("../src/middleware/authMiddleware");
const roleMiddleware = require("../src/middleware/roleMiddleware");
const { registerUser, loginUser } = require("../src/services/authService");

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "signed-token"),
  verify: jest.fn()
}));

describe("auth service and middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  test("registerUser accepts valid input and returns a safe user payload", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Alice",
      email: "alice@example.com",
      role: "USER"
    });

    const result = await registerUser({
      name: " Alice ",
      email: " ALICE@example.com ",
      password: "secret123"
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
    expect(User.create).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
      password: "secret123"
    });
    expect(result).toEqual({
      id: "507f1f77bcf86cd799439011",
      name: "Alice",
      email: "alice@example.com",
      role: "USER"
    });
    expect(result.password).toBeUndefined();
  });

  test("registerUser rejects malformed email addresses", async () => {
    await expect(registerUser({
      name: "Alice",
      email: "not-an-email",
      password: "secret123"
    })).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("valid email") });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("registerUser rejects duplicate emails", async () => {
    User.findOne.mockResolvedValue({ email: "alice@example.com" });

    await expect(registerUser({
      name: "Alice",
      email: "alice@example.com",
      password: "secret123"
    })).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("already exists") });
  });

  test("loginUser succeeds with valid credentials", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      name: "Alice",
      email: "alice@example.com",
      role: "USER",
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    User.findOne.mockResolvedValue(user);

    const result = await loginUser(" ALICE@example.com ", "secret123");

    expect(User.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
    expect(user.comparePassword).toHaveBeenCalledWith("secret123");
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: user._id, role: user.role },
      "test-secret",
      { expiresIn: "1d" }
    );
    expect(result.user).toEqual({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    expect(result.token).toBe("signed-token");
  });

  test("loginUser rejects invalid passwords and inactive users", async () => {
    const inactiveUser = {
      _id: "507f1f77bcf86cd799439011",
      name: "Alice",
      email: "alice@example.com",
      role: "USER",
      isActive: false,
      comparePassword: jest.fn()
    };
    User.findOne.mockResolvedValue(inactiveUser);

    await expect(loginUser("alice@example.com", "wrong-password")).rejects.toMatchObject({
      statusCode: 403,
      message: "User account is inactive"
    });

    const validUser = {
      _id: "507f1f77bcf86cd799439012",
      name: "Bob",
      email: "bob@example.com",
      role: "USER",
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false)
    };
    User.findOne.mockResolvedValue(validUser);

    await expect(loginUser("bob@example.com", "wrong-password")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password"
    });
  });

  test("authMiddleware accepts a valid bearer token and attaches req.user", async () => {
    jwt.verify.mockReturnValue({ userId: "507f1f77bcf86cd799439011" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Alice",
        email: "alice@example.com",
        role: "USER",
        isActive: true
      })
    });

    const req = { headers: { authorization: "Bearer validtoken" } };
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(jwt.verify).toHaveBeenCalledWith("validtoken", "test-secret");
    expect(User.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(req.user).toEqual(expect.objectContaining({ email: "alice@example.com", role: "USER" }));
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("authMiddleware rejects invalid or missing tokens", async () => {
    const next = jest.fn();
    const reqMissing = { headers: {} };
    await authMiddleware(reqMissing, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "Authentication required" }));

    const reqInvalid = { headers: { authorization: "Bearer bad-token" } };
    jwt.verify.mockImplementation(() => {
      const err = new Error("invalid signature");
      err.name = "JsonWebTokenError";
      throw err;
    });

    await authMiddleware(reqInvalid, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "Invalid token" }));
  });

  test("roleMiddleware only allows the declared role", () => {
    const next = jest.fn();
    roleMiddleware("ADMIN")({ user: { role: "USER" } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: "You do not have permission to perform this action" }));

    const nextAllowed = jest.fn();
    roleMiddleware("ADMIN")({ user: { role: "ADMIN" } }, {}, nextAllowed);
    expect(nextAllowed).toHaveBeenCalledWith();
  });
});
