---
name: type-safety
description: Use when writing TypeScript, Python, Go, Java, or Rust code. Enforces strict typing by prohibiting any/Any/interface{}/Object/dyn Any. Triggers on implementing features, creating functions, defining APIs, handling data.
---

# Type Safety Standards

## Core Principle

**Never use type escape hatches. Always provide concrete types.**

---

## TypeScript

### Prohibited
| Banned | Alternative |
|--------|-------------|
| `: any` | Concrete type or generic |
| `as any` | Type guard or correct type |
| `@ts-ignore` | Fix root type issue |

### Patterns
```typescript
// Prisma
const where: Prisma.TodoWhereInput = { userId };

// NestJS
async handler(@Request() req: RequestWithUser) {}

// React
const Component: React.FC<Props> = ({ title }) => {};

// Events
const handle = (e: React.ChangeEvent<HTMLInputElement>) => {};

// Dynamic objects
const obj: Record<string, unknown> = {};

// Error handling
catch (e) { const msg = e instanceof Error ? e.message : 'Error'; }
```

### Utility Types
`Partial<T>`, `Required<T>`, `Pick<T,K>`, `Omit<T,K>`, `Record<K,V>`, `ReturnType<F>`

---

## Python

### Prohibited
| Banned | Alternative |
|--------|-------------|
| No type hints | Add type annotations |
| `Any` | Concrete type or `TypeVar` |
| `# type: ignore` | Fix the type issue |
| `cast(Any, x)` | Proper type narrowing |

### Patterns
```python
from typing import List, Dict, Optional, TypeVar, Generic

# Function signatures
def get_user(user_id: str) -> Optional[User]:
    pass

# Generic functions
T = TypeVar('T')
def first(items: List[T]) -> Optional[T]:
    return items[0] if items else None

# Class with generics
class Repository(Generic[T]):
    def find(self, id: str) -> Optional[T]: ...

# Dict typing
config: Dict[str, int] = {"timeout": 30}

# Optional vs None
def process(data: Optional[str] = None) -> str:
    return data or "default"

# Union types (Python 3.10+)
def parse(value: str | int) -> str:
    return str(value)

# TypedDict for structured dicts
from typing import TypedDict
class UserDict(TypedDict):
    name: str
    age: int
```

### Tools
```bash
mypy --strict src/
pyright src/
```

---

## Go

### Prohibited
| Banned | Alternative |
|--------|-------------|
| `interface{}` | Concrete interface or generic |
| `any` (alias) | Type parameter `[T any]` with constraints |
| Type assertion without check | Use comma-ok idiom |

### Patterns
```go
// Generic function (Go 1.18+)
func First[T any](items []T) (T, bool) {
    if len(items) == 0 {
        var zero T
        return zero, false
    }
    return items[0], true
}

// Constrained generic
type Number interface { int | int64 | float64 }
func Sum[T Number](nums []T) T {
    var sum T
    for _, n := range nums { sum += n }
    return sum
}

// Concrete interface instead of interface{}
type Reader interface { Read(p []byte) (n int, err error) }

// Safe type assertion
if val, ok := x.(string); ok {
    // use val
}

// Struct instead of map[string]any
type Config struct {
    Timeout int    `json:"timeout"`
    Host    string `json:"host"`
}
```

---

## Java

### Prohibited
| Banned | Alternative |
|--------|-------------|
| Raw types `List` | Generic `List<T>` |
| `Object` as param/return | Generic or concrete type |
| Unchecked casts | Bounded wildcards |

### Patterns
```java
// Generic method
public <T> Optional<T> first(List<T> items) {
    return items.isEmpty() ? Optional.empty() : Optional.of(items.get(0));
}

// Bounded type parameter
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

// Wildcard types
public void process(List<? extends Number> nums) {}
public void addAll(List<? super Integer> list) {}

// Generic class
public class Repository<T extends Entity> {
    public Optional<T> findById(String id) { ... }
}

// Avoid raw types
List<String> names = new ArrayList<>();  // Not: List names = new ArrayList();

// Record for data (Java 16+)
public record User(String id, String name) {}
```

---

## Rust

### Prohibited
| Banned | Alternative |
|--------|-------------|
| `dyn Any` | Concrete trait or generic |
| Excessive `Box<dyn Trait>` | Generic `<T: Trait>` when possible |
| `.unwrap()` without check | `?` operator or pattern match |

### Patterns
```rust
// Generic function
fn first<T>(items: &[T]) -> Option<&T> {
    items.first()
}

// Trait bounds
fn print_all<T: Display>(items: &[T]) {
    for item in items { println!("{}", item); }
}

// Multiple bounds
fn process<T: Clone + Debug>(item: T) -> T {
    println!("{:?}", item);
    item.clone()
}

// Where clause for complex bounds
fn complex<T, U>(t: T, u: U) -> String
where
    T: Display + Clone,
    U: Debug,
{
    format!("{} {:?}", t, u)
}

// Enum instead of dyn Any
enum Value {
    Int(i64),
    Str(String),
    Bool(bool),
}

// Result with concrete error
fn parse(s: &str) -> Result<i32, ParseIntError> {
    s.parse()
}
```

---

## Quick Reference

| Language | Escape Hatch | Preferred Alternative |
|----------|--------------|----------------------|
| TypeScript | `any` | `T`, `unknown`, concrete |
| Python | `Any` | `TypeVar`, concrete |
| Go | `interface{}` | `[T any]` with constraints |
| Java | `Object` | `<T>`, bounded generics |
| Rust | `dyn Any` | `<T: Trait>`, enum |
