
import { describe, it, expect } from "vitest";

import { Todo } from "../src/domain/entities/Todo";
import { TodoCompletedError } from "../src/domain/error/TodoCompletedError";
import { TodoEmptyTitleError } from "../src/domain/error/TodoEmptyTitleError";

describe("Todo", () => {
  it("should create a todo with the initial state", () => {
    const todo = new Todo("1", "Learn TypeScript");

    expect(todo.id).toBe("1");
    expect(todo.title).toBe("Learn TypeScript");
    expect(todo.completed).toBe(false);
  });

  it("should trim the title when creating a todo", () => {
    const todo = new Todo("1", "  Learn TypeScript  ");

    expect(todo.title).toBe("Learn TypeScript");
  });

  it("should change the title of an active todo", () => {
    const todo = new Todo("1", "Old title");

    todo.changeTitle("New title");

    expect(todo.title).toBe("New title");
  });

  it("should reject an empty title", () => {
    expect(() => new Todo("1", "   ")).toThrow(
      TodoEmptyTitleError,
    );
  });

  it("should reject an empty title when changing it", () => {
    const todo = new Todo("1", "Learn TypeScript");

    expect(() => todo.changeTitle("   ")).toThrow(
      TodoEmptyTitleError,
    );
  });

  it("should mark a todo as completed", () => {
    const todo = new Todo("1", "Learn TypeScript");

    todo.complete();

    expect(todo.completed).toBe(true);
  });

  it("should reject title changes after completion", () => {
    const todo = new Todo("1", "Learn TypeScript");
    todo.complete();

    expect(() => todo.changeTitle("New title")).toThrow(
      TodoCompletedError,
    );
  });
});
