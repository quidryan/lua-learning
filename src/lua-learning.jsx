import { useState, useRef, useEffect, useCallback } from "react";
import { runCode, normalizeOutput } from "./luaRunner.js";

const PROGRESS_KEY_PREFIX = "lua-learning/progress/";

function getProgressKey(lessonId) {
  return `${PROGRESS_KEY_PREFIX}${lessonId}`;
}

function loadProgress(lessonId) {
  try {
    const raw = localStorage.getItem(getProgressKey(lessonId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      code: data.code,
      status: data.status ?? "not_started",
      hintsRevealed: Math.max(0, Number(data.hintsRevealed) || 0),
    };
  } catch {
    return null;
  }
}

function saveProgress(lessonId, data) {
  try {
    localStorage.setItem(getProgressKey(lessonId), JSON.stringify(data));
  } catch (_) {}
}

function loadAllProgress() {
  const out = {};
  for (let i = 1; i <= 8; i++) {
    const p = loadProgress(i);
    if (p) out[i] = p;
  }
  return out;
}

function clearAllProgress() {
  try {
    for (let i = 1; i <= 8; i++) {
      localStorage.removeItem(getProgressKey(i));
    }
    window.location.reload();
  } catch (_) {}
}

const LESSONS = [
  {
    id: 1,
    title: "The Lua Mental Model",
    subtitle: "Unlearn, then relearn",
    icon: "🧠",
    concepts: [
      {
        heading: "Everything you know is (almost) wrong",
        body: `Coming from Java/Kotlin/C#, Lua will feel alien at first. Here's the core shift:

**Lua has ONE data structure**: the table. No ArrayList, HashMap, Set, Queue. Just tables. They are arrays, dictionaries, objects, modules, and namespaces — all at once.

**Lua is 1-indexed.** Yes, really. Arrays start at 1. This will burn you for weeks.

**Variables are global by default.** The opposite of every language you know. You must explicitly say \`local\`.

**There are no classes.** No interfaces. No abstract anything. OOP is done via metatables — a prototype-based system closer to JavaScript than Java.

**Lua is dynamically typed** like Python, but even more loosely. There's no type annotations in vanilla Lua (Luau adds them).

**nil is the absence of everything.** Accessing a missing table key? \`nil\`. Undeclared variable? \`nil\`. No NullPointerException — just silent \`nil\`.`
      },
      {
        heading: "Lua vs. your languages — a cheat sheet",
        body: `| Concept | Java/C# | Kotlin | Python | Lua |
|---|---|---|---|---|
| Variable decl | \`int x = 5\` | \`val x = 5\` | \`x = 5\` | \`local x = 5\` |
| String concat | \`+\` | \`+\` or templates | \`+\` or f-strings | \`..\` (two dots) |
| Not equal | \`!=\` | \`!=\` | \`!=\` | \`~=\` |
| Boolean AND/OR | \`&&\` / \`\\|\\|\` | \`&&\` / \`\\|\\|\` | \`and\` / \`or\` | \`and\` / \`or\` |
| Array length | \`.length\` | \`.size\` | \`len()\` | \`#\` operator |
| No value | \`null\` | \`null\` | \`None\` | \`nil\` |
| Comments | \`//\` | \`//\` | \`#\` | \`--\` |
| Block comment | \`/* */\` | \`/* */\` | \`"""\` | \`--[[ ]]\` |
| For loop | \`for(i=0;i<n;i++)\` | \`for(i in 0..n)\` | \`for i in range(n)\` | \`for i=1,n do end\` |`
      },
      {
        heading: "Luau: Lua with guardrails",
        body: `Roblox uses **Luau**, a fork of Lua 5.1 with important additions:

• **Type annotations**: \`local x: number = 5\` — optional but your team probably uses them
• **String interpolation**: \`\\\`Hello {name}!\\\`\` — like Kotlin's templates
• **Generalized iteration**: \`for k, v in dict do\` — no need for \`pairs()\`
• **If-expressions** (ternary): \`local x = if cond then a else b\`
• **Continue** in loops (vanilla Lua doesn't have this!)
• **Type unions**: \`string | number\` — lightweight sum types

As a Kotlin fan who likes functional patterns, you'll appreciate that Luau adds just enough structure without losing Lua's simplicity.`
      }
    ],
    challenge: {
      title: "Translate the Java",
      description: `Convert this Java code to Lua. Think about: 1-indexing, string concatenation, the \`local\` keyword, \`~=\` for not-equal, and \`#\` for length.`,
      javaCode: `// Java
public String describeList(List<String> items) {
    if (items == null || items.size() == 0) {
        return "Empty list";
    }
    String result = "";
    for (int i = 0; i < items.size(); i++) {
        if (i != 0) {
            result += ", ";
        }
        result += items.get(i);
    }
    return result .. " (" + items.size() + " items)";
}`,
      starterCode: `function describeList(items)
  -- your code here
end

-- Test:
print(describeList({}))          --> Empty list
print(describeList({"alpha", "bravo", "charlie"}))
--> alpha, bravo, charlie`,
      solution: `function describeList(items)
  if items == nil or #items == 0 then
    return "Empty list"
  end

  local result = ""
  for i = 1, #items do
    if i ~= 1 then
      result = result .. ", "
    end
    result = result .. items[i]
  end

  return result
end

-- Test:
print(describeList({}))          --> Empty list
print(describeList({"alpha", "bravo", "charlie"}))
--> alpha, bravo, charlie`,
      hints: [
        "Lua arrays start at 1, so your loop is `for i = 1, #items do`",
        "String concatenation uses `..` not `+`",
        "Not-equal is `~=` in Lua, not `!=`",
        "`#items` gives you the length — like `.size()` in Java"
      ]
    }
  },
  {
    id: 2,
    title: "Tables: The One Data Structure",
    subtitle: "Arrays, maps, objects — all tables",
    icon: "📦",
    concepts: [
      {
        heading: "Tables as arrays",
        body: `In Lua, what you'd call an \`ArrayList\` or \`List\` is just a table with integer keys:

\`\`\`lua
local fruits = {"apple", "banana", "cherry"}
-- This is syntactic sugar for:
-- {[1] = "apple", [2] = "banana", [3] = "cherry"}

print(fruits[1])  -- "apple" (1-indexed!)
print(#fruits)    -- 3

table.insert(fruits, "date")     -- append
table.remove(fruits, 2)          -- remove at index 2
table.insert(fruits, 1, "fig")   -- insert at index 1
\`\`\`

**Coming from Java**: Think of \`table.insert\` as \`list.add()\` and \`table.remove\` as \`list.remove()\`. The \`#\` operator is \`.size()\`.

**Warning**: The \`#\` operator is only reliable for **contiguous** integer-keyed tables. If you have gaps (\`t[1]=1, t[3]=3\` with no \`t[2]\`), the result is undefined.`
      },
      {
        heading: "Tables as dictionaries / maps",
        body: `The same table type also serves as your \`HashMap\`:

\`\`\`lua
local player = {
  name = "KotlinFan42",
  health = 100,
  isAlive = true,
}

-- Access: dot notation or bracket notation
print(player.name)        -- "KotlinFan42"
print(player["health"])   -- 100

-- Dynamic keys require bracket notation
local key = "isAlive"
print(player[key])        -- true

-- Add/modify
player.score = 9001
player.health = player.health - 25

-- Remove
player.isAlive = nil   -- setting to nil removes the key
\`\`\`

**The Kotlin parallel**: Like a \`MutableMap<String, Any>\`, but with dot syntax sugar. \`player.name\` is equivalent to \`player["name"]\`.`
      },
      {
        heading: "Tables as objects (preview)",
        body: `Lua tables can hold functions, making them behave like objects:

\`\`\`lua
local enemy = {
  name = "Goblin",
  hp = 50,
}

function enemy:takeDamage(amount)
  self.hp = self.hp - amount
  if self.hp <= 0 then
    print(self.name .. " defeated!")
  end
end

enemy:takeDamage(30)  -- note the colon syntax!
enemy:takeDamage(25)  -- "Goblin defeated!"
\`\`\`

**The colon is critical**: \`enemy:takeDamage(30)\` passes \`enemy\` as \`self\` automatically. It's sugar for \`enemy.takeDamage(enemy, 30)\`. Think of \`:method()\` as calling an instance method in Java — the object before the colon becomes \`this\` (called \`self\` in Lua).`
      },
      {
        heading: "Iterating tables",
        body: `Three iteration patterns you'll use constantly:

\`\`\`lua
-- 1. Numeric for (array-style)
local colors = {"red", "green", "blue"}
for i = 1, #colors do
  print(i, colors[i])
end

-- 2. ipairs — array iteration (ordered, stops at first nil)
for index, value in ipairs(colors) do
  print(index, value)
end

-- 3. pairs — dictionary iteration (unordered, all keys)
local config = {debug = true, fps = 60, vsync = false}
for key, value in pairs(config) do
  print(key .. " = " .. tostring(value))
end
\`\`\`

**Luau bonus**: In Luau, you can use generalized iteration:
\`\`\`lua
for k, v in config do  -- no pairs() needed in Luau!
  print(k, v)
end
\`\`\``
      }
    ],
    challenge: {
      title: "Build an Inventory System",
      description: `Create functions to manage a player inventory using tables. You'll need tables-as-arrays and tables-as-dictionaries. Think about how you'd do this with Java Collections, then translate to pure table operations.`,
      javaCode: `// What this would look like in Java/Kotlin:
// class Inventory {
//   Map<String, Integer> items = new HashMap<>();
//   void addItem(String name, int qty) { ... merge ... }
//   void removeItem(String name, int qty) { ... }
//   List<String> search(String prefix) { ... filter ... }
//   String toString() { ... }
// }`,
      starterCode: `-- Build an inventory system using only tables
-- No classes needed — just functions and a table

local function createInventory()
  return {}  -- a table used as a dictionary
end

local function addItem(inventory, name, quantity)
  -- Add quantity of an item. If it exists, increase the count.
  -- Hint: inventory[name] will be nil if it doesn't exist yet
end

local function removeItem(inventory, name, quantity)
  -- Remove quantity of an item. 
  -- If quantity drops to 0 or below, remove the key entirely.
  -- Return true if successful, false if item not found.
end

local function searchItems(inventory, prefix)
  -- Return a table (array) of item names that start with 'prefix'
  -- Hint: use string.sub(name, 1, #prefix) to check prefixes
end

local function inventoryToString(inventory)
  -- Return a string like "sword x3, potion x5, shield x1"
end

-- Test:
local inv = createInventory()
addItem(inv, "sword", 2)
addItem(inv, "shield", 1)
addItem(inv, "potion", 5)
addItem(inv, "sword", 1)  -- now sword x3
print(inventoryToString(inv))

removeItem(inv, "potion", 5)  -- removes entirely
print(inventoryToString(inv))

local s = searchItems(inv, "sw")
for _, name in ipairs(s) do print("Found: " .. name) end`,
      solution: `local function createInventory()
  return {}
end

local function addItem(inventory, name, quantity)
  if inventory[name] then
    inventory[name] = inventory[name] + quantity
  else
    inventory[name] = quantity
  end
end

local function removeItem(inventory, name, quantity)
  if not inventory[name] then
    return false
  end
  inventory[name] = inventory[name] - quantity
  if inventory[name] <= 0 then
    inventory[name] = nil  -- remove key by setting to nil
  end
  return true
end

local function searchItems(inventory, prefix)
  local results = {}
  for name, _ in pairs(inventory) do
    if string.sub(name, 1, #prefix) == prefix then
      table.insert(results, name)
    end
  end
  table.sort(results)  -- deterministic order for comparison
  return results
end

local function inventoryToString(inventory)
  local keys = {}
  for name, _ in pairs(inventory) do
    table.insert(keys, name)
  end
  table.sort(keys)  -- deterministic order (Lua pairs() has no guaranteed order)
  local parts = {}
  for _, name in ipairs(keys) do
    table.insert(parts, name .. " x" .. inventory[name])
  end
  return table.concat(parts, ", ")
end

-- Test:
local inv = createInventory()
addItem(inv, "sword", 2)
addItem(inv, "shield", 1)
addItem(inv, "potion", 5)
addItem(inv, "sword", 1)  -- now sword x3
print(inventoryToString(inv))

removeItem(inv, "potion", 5)  -- removes entirely
print(inventoryToString(inv))

local s = searchItems(inv, "sw")
for _, name in ipairs(s) do print("Found: " .. name) end`,
      hints: [
        "nil check: `if inventory[name] then` — nil is falsy in Lua",
        "To delete a key from a table, assign it to nil: `inventory[name] = nil`",
        "`string.sub(s, 1, n)` extracts the first n characters — like Java's `substring(0, n)`",
        "`table.concat(t, sep)` joins an array table — like Java's `String.join()`",
        "`pairs()` has no guaranteed order; use `table.sort(keys)` on a list of keys for consistent output"
      ]
    }
  },
  {
    id: 3,
    title: "Functions as First-Class Citizens",
    subtitle: "Your functional programming instincts, unleashed",
    icon: "λ",
    concepts: [
      {
        heading: "Functions are values",
        body: `Good news for a functional programming fan: Lua treats functions as first-class values, like Kotlin lambdas but even more pervasive:

\`\`\`lua
-- Functions are just values assigned to variables
local greet = function(name)
  return "Hello, " .. name
end

-- Syntactic sugar (these are identical):
local function greet(name)
  return "Hello, " .. name
end

-- Pass functions as arguments (like Java's Function<T,R>)
local function apply(fn, value)
  return fn(value)
end

print(apply(greet, "World"))  -- "Hello, World"

-- Return functions (closures)
local function multiplier(factor)
  return function(x)
    return x * factor
  end
end

local double = multiplier(2)
local triple = multiplier(3)
print(double(5))   -- 10
print(triple(5))   -- 15
\`\`\`

This is identical to Kotlin's \`{ x -> x * factor }\` closure pattern.`
      },
      {
        heading: "Multiple return values",
        body: `This is something none of your languages do natively (Kotlin has destructuring, but it's different):

\`\`\`lua
local function divmod(a, b)
  return math.floor(a / b), a % b
end

local quotient, remainder = divmod(17, 5)
print(quotient)    -- 3
print(remainder)   -- 2

-- Ignore returns with _
local _, rem = divmod(17, 5)

-- Extra returns are discarded
local q = divmod(17, 5)  -- remainder is discarded
\`\`\`

**Pattern you'll see in Roblox**: Many APIs return \`success, result\` pairs:
\`\`\`lua
local success, data = pcall(function()
  return riskyOperation()
end)
if success then
  use(data)
else
  warn("Failed: " .. tostring(data))
end
\`\`\`
\`pcall\` is Lua's try/catch — it returns a boolean + the result or error.`
      },
      {
        heading: "Variadic functions & table.pack/unpack",
        body: `\`\`\`lua
-- ... collects all arguments (like Java's varargs)
local function sum(...)
  local args = {...}  -- pack into a table (or table.pack(...) in Luau)
  local total = 0
  for _, v in ipairs(args) do
    total = total + v
  end
  return total
end

print(sum(1, 2, 3, 4))  -- 10

-- table.unpack (Luau) or unpack (Lua 5.1) spreads a table
local nums = {10, 20, 30}
print(sum(table.unpack(nums)))  -- 60
\`\`\`

**Think of it as**: \`...\` ≈ Java's \`Object... args\`, but more flexible since Lua is dynamically typed.`
      },
      {
        heading: "Building map/filter/reduce (your FP toolkit)",
        body: `Lua doesn't ship with map/filter/reduce, but they're trivial to build — and you'll want them:

\`\`\`lua
local function map(t, fn)
  local result = {}
  for i, v in ipairs(t) do
    result[i] = fn(v, i)
  end
  return result
end

local function filter(t, predicate)
  local result = {}
  for _, v in ipairs(t) do
    if predicate(v) then
      table.insert(result, v)
    end
  end
  return result
end

local function reduce(t, fn, initial)
  local acc = initial
  for _, v in ipairs(t) do
    acc = fn(acc, v)
  end
  return acc
end

-- Usage (feels like Kotlin sequences!):
local nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

local evenDoubled = map(
  filter(nums, function(x) return x % 2 == 0 end),
  function(x) return x * 2 end
)
-- {4, 8, 12, 16, 20}

local sum = reduce(nums, function(a, b) return a + b end, 0)
-- 55
\`\`\``
      }
    ],
    challenge: {
      title: "Functional Pipeline Builder",
      description: `Build a 'pipe' function that chains transformations, like Kotlin's extension function chains or Java Streams. Then use it to solve a data transformation problem.`,
      javaCode: `// The Kotlin equivalent of what you're building:
// listOf(1,2,3,4,5,6,7,8,9,10)
//   .filter { it % 2 == 0 }
//   .map { it * it }
//   .reduce { acc, x -> acc + x }`,
      starterCode: `-- Implement these utility functions:

local function map(t, fn)
  -- Apply fn to each element, return new table
end

local function filter(t, predicate)
  -- Keep elements where predicate returns true
end

local function reduce(t, fn, initial)
  -- Fold the table with fn(accumulator, value)
end

-- BONUS: Implement pipe() that chains operations:
-- pipe(data, fn1, fn2, fn3) = fn3(fn2(fn1(data)))
local function pipe(value, ...)
  -- Apply each function in sequence to the value
end

-- Now solve this using your functions:
-- Given a list of numbers 1-20, find the sum of
-- squares of all numbers divisible by 3.
-- Expected: 9 + 36 + 81 + 144 + 225 + 324 = 819

local numbers = {}
for i = 1, 20 do table.insert(numbers, i) end

-- local result = pipe(numbers, ???, ???, ???)
-- print(result)  -- should print 819`,
      solution: `local function map(t, fn)
  local result = {}
  for i, v in ipairs(t) do
    result[i] = fn(v, i)
  end
  return result
end

local function filter(t, predicate)
  local result = {}
  for _, v in ipairs(t) do
    if predicate(v) then
      table.insert(result, v)
    end
  end
  return result
end

local function reduce(t, fn, initial)
  local acc = initial
  for _, v in ipairs(t) do
    acc = fn(acc, v)
  end
  return acc
end

local function pipe(value, ...)
  local fns = {...}
  local result = value
  for _, fn in ipairs(fns) do
    result = fn(result)
  end
  return result
end

-- Solution using pipe:
local numbers = {}
for i = 1, 20 do table.insert(numbers, i) end

local result = pipe(numbers,
  function(t) return filter(t, function(x) return x % 3 == 0 end) end,
  function(t) return map(t, function(x) return x * x end) end,
  function(t) return reduce(t, function(a, b) return a + b end, 0) end
)

print(result)  -- 819

-- You can also do it without pipe (more Lua-idiomatic):
local divisibleBy3 = filter(numbers, function(x) return x % 3 == 0 end)
local squared = map(divisibleBy3, function(x) return x * x end)
local total = reduce(squared, function(a, b) return a + b end, 0)
print(total)  -- 819`,
      hints: [
        "`...` captures all extra arguments — use `{...}` to pack them into a table",
        "pipe just loops through the functions, passing each result to the next",
        "For the math problem: filter(div by 3) → map(square) → reduce(sum)",
        "In Lua, `x % 3 == 0` checks divisibility, same as Java"
      ]
    }
  },
  {
    id: 4,
    title: "Metatables & OOP",
    subtitle: "Prototype-based inheritance for Java developers",
    icon: "🔮",
    concepts: [
      {
        heading: "What are metatables?",
        body: `Metatables are Lua's metaprogramming system. They let you customize how tables behave — operator overloading, property access, and inheritance.

\`\`\`lua
local vec = {x = 3, y = 4}
local mt = {
  __add = function(a, b)
    return setmetatable({x = a.x + b.x, y = a.y + b.y}, getmetatable(a))
  end,
  __tostring = function(v)
    return "(" .. v.x .. ", " .. v.y .. ")"
  end,
  __len = function(v)
    return math.sqrt(v.x^2 + v.y^2)
  end,
}
setmetatable(vec, mt)

local vec2 = setmetatable({x = 1, y = 2}, mt)
local vec3 = vec + vec2  -- uses __add!
print(tostring(vec3))    -- "(4, 6)"
print(#vec)              -- 5.0 (magnitude via __len)
\`\`\`

**Java parallel**: Think of metamethods as implementing interfaces:
• \`__add\` → like implementing an \`add()\` operator
• \`__tostring\` → like overriding \`toString()\`
• \`__eq\` → like overriding \`equals()\`
• \`__len\` → like implementing \`Sizeable.size()\``
      },
      {
        heading: "The __index metamethod: inheritance",
        body: `\`__index\` is the most important metamethod. When you access a key that doesn't exist in a table, Lua checks \`__index\`:

\`\`\`lua
local Animal = {}
Animal.__index = Animal

function Animal.new(name, sound)
  local self = setmetatable({}, Animal)
  self.name = name
  self.sound = sound
  return self
end

function Animal:speak()
  return self.name .. " says " .. self.sound
end

local dog = Animal.new("Rex", "Woof")
print(dog:speak())  -- "Rex says Woof"
\`\`\`

**How it works step by step**:
1. \`dog:speak()\` → Lua looks for \`speak\` in \`dog\`'s table
2. Not found → checks metatable's \`__index\`
3. \`__index\` points to \`Animal\` table
4. Finds \`speak\` in \`Animal\` → calls it with \`dog\` as \`self\`

**This is Java's class lookup**, but explicit. The metatable IS the class.`
      },
      {
        heading: "Inheritance chain",
        body: `\`\`\`lua
-- Base class
local Entity = {}
Entity.__index = Entity

function Entity.new(name, hp)
  return setmetatable({name = name, hp = hp}, Entity)
end

function Entity:isAlive()
  return self.hp > 0
end

function Entity:describe()
  return self.name .. " (HP: " .. self.hp .. ")"
end

-- Subclass: Player extends Entity
local Player = setmetatable({}, {__index = Entity})
Player.__index = Player

function Player.new(name, hp, level)
  local self = Entity.new(name, hp)  -- call super constructor
  return setmetatable(self, Player)   -- but use Player as metatable
end

function Player:describe()  -- override!
  return "⚔️ " .. Entity.describe(self) .. " [Lv." .. (self.level or 1) .. "]"
end

function Player:levelUp()
  self.level = (self.level or 1) + 1
  self.hp = self.hp + 10
end

local p = Player.new("Hero", 100, 1)
print(p:describe())   -- "⚔️ Hero (HP: 100) [Lv.1]"
print(p:isAlive())    -- true (inherited from Entity!)
p:levelUp()
print(p:describe())   -- "⚔️ Hero (HP: 110) [Lv.2]"
\`\`\`

**The inheritance chain**: \`p → Player → Entity\` — just like Java's \`this → SubClass → SuperClass\`, but built with tables.`
      }
    ],
    challenge: {
      title: "Build a Shape Hierarchy",
      description: `Create a Shape base "class" and Circle/Rectangle subclasses using metatables. Include area calculation, string representation, and a method to check if a point is inside the shape. This mirrors the classic Java OOP exercise, but the Lua way.`,
      javaCode: `// Java equivalent:
// abstract class Shape { 
//   abstract double area(); 
//   abstract boolean contains(double x, double y);
//   String toString() { ... }
// }
// class Circle extends Shape { ... }
// class Rectangle extends Shape { ... }`,
      starterCode: `-- Build a Shape class hierarchy with metatables

-- Base: Shape
local Shape = {}
Shape.__index = Shape

function Shape.new(x, y)
  -- Create a shape at position (x, y)
end

function Shape:describe()
  return "Shape at (" .. self.x .. ", " .. self.y .. ")"
end

-- Subclass: Circle extends Shape
local Circle = setmetatable({}, {__index = Shape})
Circle.__index = Circle

function Circle.new(x, y, radius)
  -- Call Shape.new, then set radius, then set metatable to Circle
end

function Circle:area()
  -- pi * r^2
end

function Circle:contains(px, py)
  -- Is point (px,py) inside this circle?
  -- Hint: distance formula, compare to radius
end

function Circle:describe()
  -- Override: "Circle(r=5) at (0, 0), area=78.54"
end

-- Subclass: Rectangle extends Shape
local Rectangle = setmetatable({}, {__index = Shape})
Rectangle.__index = Rectangle

function Rectangle.new(x, y, width, height)
  -- Similar pattern to Circle
end

function Rectangle:area()
  -- width * height
end

function Rectangle:contains(px, py)
  -- Is point inside the rectangle?
end

-- Test:
-- local c = Circle.new(0, 0, 5)
-- local r = Rectangle.new(1, 1, 10, 5)
-- print(c:describe())
-- print(c:area())
-- print(c:contains(3, 4))   -- true (distance=5, on edge)
-- print(c:contains(4, 4))   -- false
-- print(r:area())            -- 50`,
      solution: `local Shape = {}
Shape.__index = Shape

function Shape.new(x, y)
  return setmetatable({x = x, y = y}, Shape)
end

function Shape:describe()
  return "Shape at (" .. self.x .. ", " .. self.y .. ")"
end

-- Circle
local Circle = setmetatable({}, {__index = Shape})
Circle.__index = Circle

function Circle.new(x, y, radius)
  local self = Shape.new(x, y)
  self.radius = radius
  return setmetatable(self, Circle)
end

function Circle:area()
  return math.pi * self.radius ^ 2
end

function Circle:contains(px, py)
  local dx = px - self.x
  local dy = py - self.y
  return (dx * dx + dy * dy) <= self.radius ^ 2
end

function Circle:describe()
  return string.format(
    "Circle(r=%g) at (%g, %g), area=%.2f",
    self.radius, self.x, self.y, self:area()
  )
end

-- Rectangle
local Rectangle = setmetatable({}, {__index = Shape})
Rectangle.__index = Rectangle

function Rectangle.new(x, y, width, height)
  local self = Shape.new(x, y)
  self.width = width
  self.height = height
  return setmetatable(self, Rectangle)
end

function Rectangle:area()
  return self.width * self.height
end

function Rectangle:contains(px, py)
  return px >= self.x and px <= self.x + self.width
     and py >= self.y and py <= self.y + self.height
end

function Rectangle:describe()
  return string.format(
    "Rect(%gx%g) at (%g, %g), area=%.2f",
    self.width, self.height, self.x, self.y, self:area()
  )
end

-- Test
local c = Circle.new(0, 0, 5)
local r = Rectangle.new(1, 1, 10, 5)
print(c:describe())       -- Circle(r=5) at (0, 0), area=78.54
print(r:describe())       -- Rect(10x5) at (1, 1), area=50.00
print(c:contains(3, 4))   -- true
print(c:contains(4, 4))   -- false
print(r:contains(5, 3))   -- true
print(r:contains(0, 0))   -- false`,
      hints: [
        "The pattern: `local self = SuperClass.new(args)` then `setmetatable(self, SubClass)`",
        "For Circle:contains, use distance: `dx*dx + dy*dy <= radius^2` (avoids sqrt)",
        "`math.pi` is built-in. The `^` operator is exponentiation in Lua",
        "`string.format` works like C's sprintf — `%.2f` for 2 decimal places"
      ]
    }
  },
  {
    id: 5,
    title: "Closures, Scoping & Modules",
    subtitle: "Encapsulation without classes",
    icon: "🔒",
    concepts: [
      {
        heading: "Lexical scoping & closures",
        body: `Lua has lexical scoping identical to Kotlin/Python. Closures capture variables from enclosing scope:

\`\`\`lua
local function counter(start)
  local count = start or 0
  return {
    increment = function() count = count + 1 end,
    decrement = function() count = count - 1 end,
    get = function() return count end,
  }
end

local c = counter(10)
c.increment()
c.increment()
print(c.get())  -- 12

-- 'count' is fully encapsulated — no way to access it
-- except through the returned functions. This is REAL
-- information hiding, stronger than Java's 'private'.
\`\`\`

**Key insight for your team**: In Lua/Luau, closures are the idiomatic way to create private state. No \`private\` keyword needed — if the variable isn't in the returned table, it's invisible.`
      },
      {
        heading: "The module pattern",
        body: `Since Lua has no built-in module system (Luau does), modules are just tables:

\`\`\`lua
-- mathUtils.lua
local MathUtils = {}

-- Private (not in returned table)
local function clamp(x, min, max)
  return math.max(min, math.min(max, x))
end

-- Public
function MathUtils.lerp(a, b, t)
  t = clamp(t, 0, 1)
  return a + (b - a) * t
end

function MathUtils.distance(x1, y1, x2, y2)
  local dx, dy = x2 - x1, y2 - y1
  return math.sqrt(dx*dx + dy*dy)
end

return MathUtils
\`\`\`

\`\`\`lua
-- Using the module:
local MathUtils = require("mathUtils")
print(MathUtils.lerp(0, 100, 0.5))    -- 50
print(MathUtils.distance(0, 0, 3, 4)) -- 5
\`\`\`

**This is exactly like** a Kotlin \`object\` (singleton) or a Java class with only static methods. The \`local\` function \`clamp\` is truly private — it's a closure variable, not part of the returned table.`
      },
      {
        heading: "Error handling: pcall & xpcall",
        body: `Lua has no try/catch. Instead, you use \`pcall\` (protected call):

\`\`\`lua
-- pcall = try/catch equivalent
local ok, result = pcall(function()
  -- code that might error
  return someDangerousOperation()
end)

if ok then
  print("Success: " .. tostring(result))
else
  print("Error: " .. tostring(result))  -- result is the error message
end

-- xpcall = pcall with a custom error handler (gives you stack trace)
local ok, result = xpcall(
  function()
    error("something broke")
  end,
  function(err)
    return debug.traceback(err, 2)  -- like Java's printStackTrace()
  end
)
\`\`\`

**Coming from C#/Java**: Think of \`pcall\` as a function that wraps try-catch and returns \`(bool success, T resultOrError)\`. The \`error()\` function is like \`throw\`.`
      }
    ],
    challenge: {
      title: "Build a State Machine Module",
      description: `Create a reusable state machine module using closures for encapsulation. This is a common pattern in Roblox game development — UI states, NPC behavior, game phases. Use the module pattern to hide internal state.`,
      javaCode: `// Java equivalent:
// public class StateMachine {
//   private String currentState;
//   private Map<String, Map<String, String>> transitions;
//   private Map<String, Runnable> onEnter;
//   public void addTransition(from, event, to) { ... }
//   public void onEnterState(state, callback) { ... }
//   public boolean trigger(event) { ... }
// }`,
      starterCode: `-- State Machine Module
-- Use closures to encapsulate ALL state

local function createStateMachine(initialState)
  -- These locals are PRIVATE (closure variables)
  local currentState = initialState
  local transitions = {}  -- transitions[fromState][event] = toState
  local enterCallbacks = {}  -- enterCallbacks[state] = function
  local exitCallbacks = {}

  -- Return a table of public methods:
  local machine = {}

  function machine:addTransition(fromState, event, toState)
    -- Register: when in fromState and event occurs, go to toState
  end

  function machine:onEnter(state, callback)
    -- Register a callback for when we enter a state
  end

  function machine:onExit(state, callback)
    -- Register a callback for when we leave a state
  end

  function machine:trigger(event)
    -- Look up transition from current state + event
    -- If valid: call exit callback, change state, call enter callback
    -- Return true/false for success
  end

  function machine:getState()
    return currentState
  end

  return machine
end

-- Test: a simple door
-- States: "locked", "closed", "open"
-- Events: "unlock", "lock", "open", "close"`,
      solution: `local function createStateMachine(initialState)
  local currentState = initialState
  local transitions = {}
  local enterCallbacks = {}
  local exitCallbacks = {}

  local machine = {}

  function machine:addTransition(fromState, event, toState)
    if not transitions[fromState] then
      transitions[fromState] = {}
    end
    transitions[fromState][event] = toState
  end

  function machine:onEnter(state, callback)
    enterCallbacks[state] = callback
  end

  function machine:onExit(state, callback)
    exitCallbacks[state] = callback
  end

  function machine:trigger(event)
    local stateTransitions = transitions[currentState]
    if not stateTransitions then return false end

    local nextState = stateTransitions[event]
    if not nextState then return false end

    -- Exit old state
    if exitCallbacks[currentState] then
      exitCallbacks[currentState](currentState, event)
    end

    local prevState = currentState
    currentState = nextState

    -- Enter new state
    if enterCallbacks[currentState] then
      enterCallbacks[currentState](currentState, prevState)
    end

    return true
  end

  function machine:getState()
    return currentState
  end

  return machine
end

-- Test: Door state machine
local door = createStateMachine("locked")

door:addTransition("locked", "unlock", "closed")
door:addTransition("closed", "lock",   "locked")
door:addTransition("closed", "open",   "open")
door:addTransition("open",   "close",  "closed")

door:onEnter("open", function(state, from)
  print("The door swings open!")
end)

door:onEnter("locked", function(state, from)
  print("*click* The door is locked.")
end)

print("State: " .. door:getState())     -- locked
print(door:trigger("open"))             -- false (can't open locked door)
print(door:trigger("unlock"))           -- true
print("State: " .. door:getState())     -- closed
door:trigger("open")                    -- "The door swings open!"
print("State: " .. door:getState())     -- open
door:trigger("close")
door:trigger("lock")                    -- "*click* The door is locked."
print("State: " .. door:getState())     -- locked`,
      hints: [
        "Use nested tables for transitions: `transitions[fromState] = {}` then `transitions[fromState][event] = toState`",
        "Check for nil before indexing: `if not transitions[currentState] then return false end`",
        "The colon syntax `machine:trigger(event)` automatically passes `machine` as `self`, but since we use closure variables, we don't actually need `self` here",
        "Callbacks receive extra context so callers know what happened"
      ]
    }
  },
  {
    id: 6,
    title: "Coroutines & Async Patterns",
    subtitle: "Cooperative multitasking, Lua style",
    icon: "⚡",
    concepts: [
      {
        heading: "Coroutines: cooperative concurrency",
        body: `Lua coroutines are like Kotlin coroutines' spiritual ancestor, but simpler and cooperative:

\`\`\`lua
local function producer()
  local items = {"sword", "shield", "potion"}
  for _, item in ipairs(items) do
    print("Producing: " .. item)
    coroutine.yield(item)  -- pause and return value
  end
end

local co = coroutine.create(producer)

-- Resume returns: success, yielded_value
local ok, item = coroutine.resume(co)  -- "Producing: sword"
print(item)  -- "sword"

ok, item = coroutine.resume(co)  -- "Producing: shield"
print(item)  -- "shield"
\`\`\`

**vs. Kotlin coroutines**: Lua coroutines are NOT preemptive — they only switch when you explicitly \`yield\`. Think of them as manual generators/iterators.`
      },
      {
        heading: "Coroutines as iterators",
        body: `The most practical use — creating custom iterators (like Python generators):

\`\`\`lua
-- Fibonacci generator (infinite sequence!)
local function fibonacci()
  return coroutine.wrap(function()
    local a, b = 0, 1
    while true do
      coroutine.yield(a)
      a, b = b, a + b
    end
  end)
end

-- Use like any iterator:
local fib = fibonacci()
for i = 1, 10 do
  print(fib())
end
-- 0, 1, 1, 2, 3, 5, 8, 13, 21, 34

-- Generic range with step (like Python's range)
local function range(start, stop, step)
  return coroutine.wrap(function()
    local i = start
    while i <= stop do
      coroutine.yield(i)
      i = i + (step or 1)
    end
  end)
end

for n in range(1, 20, 3) do
  print(n)  -- 1, 4, 7, 10, 13, 16, 19
end
\`\`\`

\`coroutine.wrap\` creates a function you can call directly — much cleaner than \`create\`/\`resume\` for iterators.`
      },
      {
        heading: "Coroutines in Roblox",
        body: `In Roblox Luau, coroutines are used heavily with the \`task\` library:

\`\`\`lua
-- Roblox-specific patterns you'll see:
task.spawn(function()
  -- Runs concurrently (on the same thread, but yielding appropriately)
  while true do
    updateNPC()
    task.wait(0.5)  -- yield for 0.5 seconds
  end
end)

task.delay(3, function()
  -- Runs after 3 seconds
  print("Delayed execution!")
end)

-- These are built on coroutines under the hood.
-- Understanding coroutines helps you debug when things
-- don't run when you expect.
\`\`\`

**Key mental model**: Unlike Java threads or C# async/await, Lua coroutines are **single-threaded**. Only one coroutine runs at a time. \`yield\` is an explicit "I'm done for now, someone else can run."`
      }
    ],
    challenge: {
      title: "Build a Task Scheduler",
      description: `Create a simple cooperative task scheduler using coroutines. Each task is a coroutine that can yield to let others run. This simulates how Roblox's task system works under the hood.`,
      javaCode: `// Conceptually similar to:
// ExecutorService with cooperative scheduling
// Each "task" voluntarily yields its time slice`,
      starterCode: `-- Cooperative Task Scheduler using coroutines

local function createScheduler()
  local tasks = {}  -- array of {coroutine, name}

  local scheduler = {}

  function scheduler:addTask(name, fn)
    -- Create a coroutine from fn and add to tasks list
  end

  function scheduler:run()
    -- Round-robin: resume each task in order
    -- Remove tasks that have finished (coroutine.status == "dead")
    -- Keep going until all tasks are done
    -- Print "[name] yielded" or "[name] finished" as appropriate
  end

  return scheduler
end

-- Test: Three tasks that interleave
local s = createScheduler()

s:addTask("Download", function()
  for i = 1, 3 do
    print("  Downloading chunk " .. i .. "/3...")
    coroutine.yield()
  end
  print("  Download complete!")
end)

s:addTask("Render", function()
  for frame = 1, 4 do
    print("  Rendering frame " .. frame .. "...")
    coroutine.yield()
  end
  print("  Rendering done!")
end)

s:addTask("Audio", function()
  for i = 1, 2 do
    print("  Loading sound " .. i .. "...")
    coroutine.yield()
  end
  print("  Audio ready!")
end)

s:run()
-- Should see tasks interleaving!`,
      solution: `local function createScheduler()
  local tasks = {}

  local scheduler = {}

  function scheduler:addTask(name, fn)
    table.insert(tasks, {
      co = coroutine.create(fn),
      name = name,
    })
  end

  function scheduler:run()
    local tick = 0
    while #tasks > 0 do
      tick = tick + 1
      print("--- Tick " .. tick .. " ---")

      local i = 1
      while i <= #tasks do
        local task = tasks[i]
        local ok, err = coroutine.resume(task.co)

        if not ok then
          print("[" .. task.name .. "] ERROR: " .. tostring(err))
          table.remove(tasks, i)
        elseif coroutine.status(task.co) == "dead" then
          print("[" .. task.name .. "] finished")
          table.remove(tasks, i)
        else
          print("[" .. task.name .. "] yielded")
          i = i + 1
        end
      end
    end
    print("All tasks complete!")
  end

  return scheduler
end

-- Test
local s = createScheduler()

s:addTask("Download", function()
  for i = 1, 3 do
    print("  Downloading chunk " .. i .. "/3...")
    coroutine.yield()
  end
  print("  Download complete!")
end)

s:addTask("Render", function()
  for frame = 1, 4 do
    print("  Rendering frame " .. frame .. "...")
    coroutine.yield()
  end
  print("  Rendering done!")
end)

s:addTask("Audio", function()
  for i = 1, 2 do
    print("  Loading sound " .. i .. "...")
    coroutine.yield()
  end
  print("  Audio ready!")
end)

s:run()`,
      hints: [
        "`coroutine.create(fn)` creates a coroutine; `coroutine.resume(co)` runs it until the next yield",
        "`coroutine.status(co)` returns 'dead' when the function has returned (finished)",
        "When removing from an array while iterating, don't increment `i` when you remove — the next element slides into position `i`",
        "`coroutine.resume` returns `ok, error` — check `ok` to handle errors gracefully"
      ]
    }
  },
  {
    id: 7,
    title: "String Patterns & Standard Library",
    subtitle: "Lua's regex-lite and essential tools",
    icon: "🔧",
    concepts: [
      {
        heading: "String patterns (not regex!)",
        body: `Lua doesn't have regex. It has a simpler pattern system:

\`\`\`lua
-- Character classes:
-- %a = letters    %d = digits    %w = alphanumeric
-- %s = whitespace %p = punctuation %l = lowercase
-- %u = uppercase  .  = any char

-- Uppercase = complement: %A = non-letters, %D = non-digits

local s = "Player_42 scored 100 points"

-- string.match: extract matches
local name = string.match(s, "(%a+_%d+)")  -- "Player_42"
local score = string.match(s, "scored (%d+)")  -- "100"

-- string.gmatch: iterate all matches
for word in string.gmatch(s, "%a+") do
  print(word)  -- Player, scored, points
end

-- string.gsub: replace
local clean = string.gsub(s, "%d+", "#")
-- "Player_# scored # points"

-- string.find: locate
local start, finish = string.find(s, "scored")
-- 11, 16
\`\`\`

**vs Java regex**: No \`+?\`, no lookahead/lookbehind, no \`\\b\`. Much simpler. Think of it as "regex for embedded systems." Luau adds \`string.split()\` which is a lifesaver.`
      },
      {
        heading: "Essential standard library",
        body: `\`\`\`lua
-- STRING
string.format("HP: %d/%d (%.1f%%)", 75, 100, 75.0)  -- "HP: 75/100 (75.0%)"
string.rep("-", 40)           -- "----------------------------------------"
string.reverse("hello")      -- "olleh"
string.upper("hello")        -- "HELLO"
string.byte("A")             -- 65
string.char(65)              -- "A"

-- TABLE
table.insert(t, value)       -- append
table.insert(t, i, value)    -- insert at position
table.remove(t, i)           -- remove at position, returns removed
table.sort(t)                -- in-place sort (like Java's Arrays.sort)
table.sort(t, function(a, b) return a > b end)  -- custom comparator
table.concat(t, ", ")        -- join (like String.join in Java)

-- MATH
math.max(1, 2, 3)       -- 3
math.min(1, 2, 3)       -- 1
math.floor(3.7)          -- 3
math.ceil(3.2)           -- 4
math.random(1, 100)      -- random int 1-100
math.abs(-5)             -- 5
math.sqrt(16)            -- 4

-- OS / SYSTEM
os.time()                -- Unix timestamp
os.clock()               -- CPU time (for benchmarking)
\`\`\``
      }
    ],
    challenge: {
      title: "Log Parser",
      description: `Parse game log entries using Lua string patterns. Extract structured data from unstructured text — a common real-world task. This combines string patterns with tables and functional patterns from earlier lessons.`,
      javaCode: `// Java equivalent would use Pattern/Matcher:
// Pattern.compile("\\[(\\w+)\\] (\\w+): (.+)")
//   .matcher(line).matches()`,
      starterCode: `-- Parse these game log lines into structured data:
local logs = {
  "[INFO] Player:Join name=Alice server=US-East",
  "[WARN] Player:LowHP name=Bob hp=15 max=100",
  "[ERROR] Server:Crash code=503 message=timeout",
  "[INFO] Player:Score name=Alice points=250",
  "[INFO] Player:Join name=Charlie server=EU-West",
  "[WARN] Player:LowHP name=Alice hp=8 max=100",
  "[INFO] Player:Leave name=Bob reason=disconnect",
}

local function parseLogLine(line)
  -- Extract: level, category, event, and all key=value pairs
  -- Return a table like:
  -- {level="INFO", category="Player", event="Join", name="Alice", server="US-East"}
  -- Hint: use string.match for level/category/event,
  -- then string.gmatch for key=value pairs
end

local function filterLogs(entries, filterFn)
  -- Filter parsed log entries by a predicate function
end

local function summarize(entries)
  -- Return a summary table:
  -- { totalEntries, countByLevel, uniquePlayers, events }
end

-- Test:
-- local parsed = map(logs, parseLogLine)
-- local warnings = filterLogs(parsed, function(e) return e.level == "WARN" end)
-- local summary = summarize(parsed)`,
      solution: `local function parseLogLine(line)
  local entry = {}

  -- Extract level: [INFO], [WARN], etc.
  entry.level = string.match(line, "%[(%u+)%]")

  -- Extract category:event
  entry.category, entry.event = string.match(line, "] (%w+):(%w+)")

  -- Extract all key=value pairs
  for key, value in string.gmatch(line, "(%w+)=(%S+)") do
    entry[key] = tonumber(value) or value  -- auto-convert numbers
  end

  return entry
end

local function map(t, fn)
  local result = {}
  for i, v in ipairs(t) do result[i] = fn(v) end
  return result
end

local function filterLogs(entries, filterFn)
  local result = {}
  for _, entry in ipairs(entries) do
    if filterFn(entry) then
      table.insert(result, entry)
    end
  end
  return result
end

local function summarize(entries)
  local summary = {
    totalEntries = #entries,
    countByLevel = {},
    uniquePlayers = {},
    events = {},
  }

  for _, entry in ipairs(entries) do
    -- Count by level
    local lvl = entry.level
    summary.countByLevel[lvl] = (summary.countByLevel[lvl] or 0) + 1

    -- Track unique players
    if entry.name then
      summary.uniquePlayers[entry.name] = true
    end

    -- Track events
    local evt = entry.category .. ":" .. entry.event
    summary.events[evt] = (summary.events[evt] or 0) + 1
  end

  return summary
end

-- Test
local logs = {
  "[INFO] Player:Join name=Alice server=US-East",
  "[WARN] Player:LowHP name=Bob hp=15 max=100",
  "[ERROR] Server:Crash code=503 message=timeout",
  "[INFO] Player:Score name=Alice points=250",
  "[INFO] Player:Join name=Charlie server=EU-West",
  "[WARN] Player:LowHP name=Alice hp=8 max=100",
  "[INFO] Player:Leave name=Bob reason=disconnect",
}

local parsed = map(logs, parseLogLine)

for _, entry in ipairs(parsed) do
  print(entry.level .. " | " .. entry.category .. ":" .. entry.event)
end

local warnings = filterLogs(parsed, function(e) return e.level == "WARN" end)
print("\\nWarnings: " .. #warnings)

local criticalHP = filterLogs(parsed, function(e)
  return e.event == "LowHP" and (e.hp or 100) < 10
end)
print("Critical HP: " .. #criticalHP)

local s = summarize(parsed)
print("\\nTotal entries: " .. s.totalEntries)
for level, count in pairs(s.countByLevel) do
  print("  " .. level .. ": " .. count)
end
print("Unique players:")
for name in pairs(s.uniquePlayers) do
  print("  " .. name)
end`,
      hints: [
        "`string.match(line, '%[(%u+)%]')` captures uppercase letters inside brackets",
        "`string.gmatch(line, '(%w+)=(%S+)')` iterates all key=value pairs (non-space values)",
        "`tonumber(value) or value` — tries to convert to number, keeps string if it fails",
        "Track unique items with `set[item] = true`, iterate with `for k in pairs(set)`"
      ]
    }
  },
  {
    id: 8,
    title: "Luau-Specific Features & Roblox Patterns",
    subtitle: "The production environment you'll actually work in",
    icon: "🎮",
    concepts: [
      {
        heading: "Luau type system",
        body: `Luau adds gradual typing — optional but your team will likely use it:

\`\`\`lua
-- Basic type annotations
local name: string = "Player1"
local health: number = 100
local isAlive: boolean = true

-- Function signatures
local function damage(target: Entity, amount: number): boolean
  target.hp -= amount
  return target.hp > 0
end

-- Type aliases (like Kotlin's typealias)
type Point = {x: number, y: number}
type Callback = (result: string) -> ()

-- Union types (like Kotlin's sealed class, but simpler)
type Result = {ok: true, data: string} | {ok: false, error: string}

-- Generic functions
local function first<T>(list: {T}): T?
  return list[1]
end

-- Optional type (T? means T | nil)
local function find(name: string): Player?
  return playerMap[name]  -- might be nil
end
\`\`\`

**As a Kotlin developer**, you'll find Luau's type system familiar but less powerful. No sealed classes, no data classes, no pattern matching on types. But the basics — generics, union types, optionals — are there.`
      },
      {
        heading: "Roblox architecture patterns",
        body: `The codebase you'll work in follows specific patterns:

\`\`\`lua
-- ModuleScript pattern (your bread and butter)
local PlayerManager = {}

type PlayerData = {
  name: string,
  level: number,
  inventory: {string},
}

local players: {[string]: PlayerData} = {}

function PlayerManager.addPlayer(userId: string, name: string)
  players[userId] = {
    name = name,
    level = 1,
    inventory = {},
  }
end

function PlayerManager.getPlayer(userId: string): PlayerData?
  return players[userId]
end

return PlayerManager
\`\`\`

**Key Roblox conventions you'll encounter:**
• **ModuleScripts** return a table (the module pattern from Lesson 5)
• **Client/Server split**: Some code runs on server, some on client
• **Services**: \`game:GetService("Players")\` — accessed via the colon method syntax
• **Events**: \`.Changed:Connect(callback)\` — observer pattern everywhere
• **Instance hierarchy**: Everything is in a tree, like the DOM but for 3D`
      },
      {
        heading: "Common idioms",
        body: `Patterns you'll see in every Luau codebase:

\`\`\`lua
-- 1. Default values (like Kotlin's ?: operator)
local timeout = options.timeout or 30
local name = player.name or "Unknown"

-- 2. Guard clauses
function process(data)
  if not data then return end
  if not data.valid then return end
  -- actual logic here
end

-- 3. Method chaining with colon syntax
game:GetService("Players")
  :GetPlayerByUserId(12345)

-- 4. Ternary via if-expression (Luau only!)
local label = if health > 50 then "Healthy" else "Wounded"

-- 5. String interpolation (Luau)
local msg = \`{player.name} scored {points} points!\`

-- 6. Table freezing (immutable tables)
local CONSTANTS = table.freeze({
  MAX_PLAYERS = 50,
  TICK_RATE = 60,
  VERSION = "2.1.0",
})
-- CONSTANTS.MAX_PLAYERS = 100  -- ERROR: frozen!

-- 7. Destructuring-ish pattern
local function getPosition()
  return 10, 20, 30
end
local x, y, z = getPosition()
\`\`\``
      }
    ],
    challenge: {
      title: "Mini Game System",
      description: `Put it ALL together: build a small game system using Luau patterns. Create typed modules, use metatables for game entities, closures for encapsulation, coroutines for game loop timing, and functional patterns for data processing. This is your final boss.`,
      javaCode: `// This would be a multi-file Java project:
// Entity.java, Player.java, GameWorld.java, 
// GameLoop.java, EventBus.java`,
      starterCode: `-- FINAL CHALLENGE: Mini Game System
-- Combine everything you've learned!

-- 1. Event system (closures + tables)
local function createEventBus()
  -- listeners[eventName] = {callback, callback, ...}
  -- Methods: on(event, callback), emit(event, ...data)
end

-- 2. Entity base "class" (metatables)
local Entity = {}
Entity.__index = Entity

-- Give entities: id, name, x, y, hp, maxHp
-- Methods: move(dx,dy), damage(amt), heal(amt), isAlive(), describe()

-- 3. Player subclass
local Player = setmetatable({}, {__index = Entity})
Player.__index = Player
-- Add: score, level, inventory (table)
-- Methods: addToInventory(item), getScore()

-- 4. Game World (module pattern + functional)
local function createWorld()
  -- Private: entities table, event bus, tick counter
  -- Public: addEntity, removeEntity, getEntitiesInRadius(x,y,r),
  --         tick() (advance game by one step),
  --         getStats() (use map/filter/reduce to compute stats)
end

-- Test your system:
-- local world = createWorld()
-- local p1 = Player.new("Hero", 100, 100)
-- local p2 = Player.new("Mage", 50, 200)
-- world:addEntity(p1)
-- world:addEntity(p2)
-- world:tick()
-- print(world:getStats())`,
      solution: `-- Event Bus
local function createEventBus()
  local listeners = {}

  return {
    on = function(self, event, callback)
      if not listeners[event] then
        listeners[event] = {}
      end
      table.insert(listeners[event], callback)
    end,

    emit = function(self, event, ...)
      if not listeners[event] then return end
      for _, callback in ipairs(listeners[event]) do
        callback(...)
      end
    end,
  }
end

-- Entity base class
local Entity = {}
Entity.__index = Entity

local nextId = 0
function Entity.new(name, x, y, hp)
  nextId = nextId + 1
  return setmetatable({
    id = nextId,
    name = name,
    x = x or 0,
    y = y or 0,
    hp = hp or 100,
    maxHp = hp or 100,
  }, Entity)
end

function Entity:move(dx, dy)
  self.x = self.x + dx
  self.y = self.y + dy
end

function Entity:damage(amount)
  self.hp = math.max(0, self.hp - amount)
  return self.hp
end

function Entity:heal(amount)
  self.hp = math.min(self.maxHp, self.hp + amount)
  return self.hp
end

function Entity:isAlive()
  return self.hp > 0
end

function Entity:distanceTo(other)
  local dx = other.x - self.x
  local dy = other.y - self.y
  return math.sqrt(dx * dx + dy * dy)
end

function Entity:describe()
  return string.format("%s#%d at (%.0f,%.0f) HP:%d/%d",
    self.name, self.id, self.x, self.y, self.hp, self.maxHp)
end

-- Player subclass
local Player = setmetatable({}, {__index = Entity})
Player.__index = Player

function Player.new(name, x, y)
  local self = Entity.new(name, x, y, 100)
  self.score = 0
  self.level = 1
  self.inventory = {}
  return setmetatable(self, Player)
end

function Player:addToInventory(item)
  table.insert(self.inventory, item)
end

function Player:addScore(points)
  self.score = self.score + points
  if self.score >= self.level * 100 then
    self.level = self.level + 1
    self.maxHp = self.maxHp + 10
    self.hp = self.maxHp
  end
end

function Player:describe()
  return string.format(
    "%s [Lv.%d | Score:%d | Items:%d]",
    Entity.describe(self), self.level, self.score, #self.inventory
  )
end

-- Game World
local function createWorld()
  local entities = {}
  local events = createEventBus()
  local tick = 0

  local world = {}

  function world:addEntity(entity)
    entities[entity.id] = entity
    events:emit("entityAdded", entity)
  end

  function world:removeEntity(entity)
    entities[entity.id] = nil
    events:emit("entityRemoved", entity)
  end

  function world:getEntitiesInRadius(x, y, radius)
    local result = {}
    for _, e in pairs(entities) do
      local dx = e.x - x
      local dy = e.y - y
      if math.sqrt(dx*dx + dy*dy) <= radius then
        table.insert(result, e)
      end
    end
    return result
  end

  function world:onEvent(event, callback)
    events:on(event, callback)
  end

  function world:step()
    tick = tick + 1
    events:emit("tick", tick)

    -- Remove dead entities
    for id, entity in pairs(entities) do
      if not entity:isAlive() then
        events:emit("entityDied", entity)
        entities[id] = nil
      end
    end
  end

  function world:getStats()
    local all = {}
    for _, e in pairs(entities) do
      table.insert(all, e)
    end

    local alive = 0
    local totalHp = 0
    for _, e in pairs(entities) do
      if e:isAlive() then alive = alive + 1 end
      totalHp = totalHp + e.hp
    end

    return {
      tick = tick,
      totalEntities = #all,
      alive = alive,
      avgHp = #all > 0 and (totalHp / #all) or 0,
    }
  end

  return world
end

-- === TEST ===
local world = createWorld()

world:onEvent("entityAdded", function(e)
  print("+ " .. e:describe())
end)
world:onEvent("entityDied", function(e)
  print("X " .. e.name .. " has fallen!")
end)

local hero = Player.new("Hero", 0, 0)
local mage = Player.new("Mage", 10, 10)
local goblin = Entity.new("Goblin", 5, 5, 30)

world:addEntity(hero)
world:addEntity(mage)
world:addEntity(goblin)

hero:addScore(150)  -- level up!
hero:addToInventory("Sword")
mage:addToInventory("Staff")
goblin:damage(30)   -- goblin dies

world:step()  -- removes dead entities

local nearby = world:getEntitiesInRadius(0, 0, 15)
print("\\nNearby entities:")
for _, e in ipairs(nearby) do
  print("  " .. e:describe())
end

local stats = world:getStats()
print(string.format(
  "\\nWorld: tick=%d, entities=%d, alive=%d, avgHP=%.1f",
  stats.tick, stats.totalEntities, stats.alive, stats.avgHp
))`,
      hints: [
        "Event bus: store callbacks in `listeners[eventName]` array, emit calls them all with `...` args",
        "Player.new: call Entity.new first, add extra fields, then `setmetatable(self, Player)`",
        "For getStats, iterate entities with `pairs()` and accumulate counts",
        "The world step function should check `isAlive()` and clean up dead entities"
      ]
    }
  }
];

// ─── THEME ───
const theme = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceLight: "#1a2235",
  accent: "#22d3ee",
  accentDim: "#0e7490",
  accentGlow: "rgba(34, 211, 238, 0.15)",
  warn: "#f59e0b",
  success: "#10b981",
  error: "#ef4444",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  border: "#1e293b",
  codeBg: "#0d1117",
};

const font = {
  display: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
  body: "'Inter', -apple-system, sans-serif",
  code: "'JetBrains Mono', 'Fira Code', monospace",
};

// ─── Components ───
function CodeBlock({ code, language = "lua", maxHeight = 400 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <div style={{
        background: theme.codeBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 12px",
          borderBottom: `1px solid ${theme.border}`,
          background: "rgba(255,255,255,0.02)",
        }}>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: font.code }}>{language}</span>
          <button onClick={handleCopy} style={{
            background: "none", border: "none", color: copied ? theme.success : theme.textMuted,
            cursor: "pointer", fontSize: 11, fontFamily: font.code, padding: "2px 8px",
          }}>
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>
        <pre style={{
          margin: 0, padding: 16, fontSize: 13, lineHeight: 1.6,
          fontFamily: font.code, color: theme.text, overflow: "auto",
          maxHeight, whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {code}
        </pre>
      </div>
    </div>
  );
}

function MarkdownLite({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s\-|]+\|$/)) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|")) {
        tableLines.push(lines[j]);
        j++;
      }
      const headers = tableLines[0].split("|").filter(c => c.trim()).map(c => c.trim());
      const rows = tableLines.slice(2).map(r => r.split("|").filter(c => c.trim()).map(c => c.trim()));
      elements.push(
        <div key={i} style={{ overflowX: "auto", margin: "12px 0" }}>
          <table style={{
            borderCollapse: "collapse", fontSize: 13, fontFamily: font.code,
            width: "100%", border: `1px solid ${theme.border}`,
          }}>
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} style={{
                    padding: "8px 12px", textAlign: "left", background: theme.surfaceLight,
                    borderBottom: `2px solid ${theme.accent}`, color: theme.accent, fontSize: 11,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "6px 12px", borderBottom: `1px solid ${theme.border}`,
                      color: theme.textDim, whiteSpace: "nowrap",
                    }}>
                      <InlineFormat text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={i} code={codeLines.join("\n")} language={lang || "lua"} />);
      i++;
      continue;
    }

    // Bullets
    if (line.match(/^[•\-\*]\s/)) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, marginLeft: 8, marginBottom: 4 }}>
          <span style={{ color: theme.accentDim }}>•</span>
          <span style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>
            <InlineFormat text={line.replace(/^[•\-\*]\s/, "")} />
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.7, margin: "4px 0" }}>
        <InlineFormat text={line} />
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function InlineFormat({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\\\`[^`]+\\\`)/g);
  return <>
    {parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: theme.text, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} style={{
          background: theme.codeBg, padding: "2px 6px", borderRadius: 4,
          fontFamily: font.code, fontSize: 12, color: theme.accent,
          border: `1px solid ${theme.border}`,
        }}>{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    })}
  </>;
}

function HintSystem({ hints, initialRevealed = 0, onReveal }) {
  const [revealed, setRevealed] = useState(initialRevealed);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const handleReveal = useCallback(() => {
    setRevealed(r => {
      const next = r + 1;
      onRevealRef.current?.(next);
      return next;
    });
  }, []);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: theme.textMuted, fontFamily: font.code }}>
          HINTS ({revealed}/{hints.length})
        </span>
        {revealed < hints.length && (
          <button onClick={handleReveal} style={{
            background: "none", border: `1px solid ${theme.border}`, color: theme.warn,
            padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12,
            fontFamily: font.code, transition: "all 0.2s",
          }}>
            reveal next hint
          </button>
        )}
      </div>
      {hints.slice(0, revealed).map((hint, i) => (
        <div key={i} style={{
          background: "rgba(245, 158, 11, 0.08)", border: `1px solid rgba(245, 158, 11, 0.2)`,
          borderRadius: 6, padding: "8px 12px", marginBottom: 6, fontSize: 13,
          color: theme.warn, fontFamily: font.code,
        }}>
          <span style={{ opacity: 0.5 }}>#{i + 1}</span> {hint}
        </div>
      ))}
    </div>
  );
}

function Challenge({ challenge, lessonId, onProgressChange }) {
  const [showSolution, setShowSolution] = useState(false);
  const saved = loadProgress(lessonId);
  const [code, setCode] = useState(() => saved?.code ?? challenge.starterCode);
  const [status, setStatus] = useState(() => saved?.status ?? "not_started");
  const [hintsRevealed, setHintsRevealed] = useState(() => saved?.hintsRevealed ?? 0);
  const [runOutput, setRunOutput] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const debounceRef = useRef(null);
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    setRunOutput(null);
    setSubmitResult(null);
  }, [lessonId]);

  const persist = useCallback(
    (updates) => {
      const next = {
        code: updates.code !== undefined ? updates.code : code,
        status: updates.status !== undefined ? updates.status : status,
        hintsRevealed: updates.hintsRevealed !== undefined ? updates.hintsRevealed : hintsRevealed,
      };
      saveProgress(lessonId, next);
      if (updates.status !== undefined) setStatus(updates.status);
      if (updates.hintsRevealed !== undefined) setHintsRevealed(updates.hintsRevealed);
      onProgressChange?.(next);
    },
    [lessonId, code, status, hintsRevealed, onProgressChange]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveProgress(lessonId, { code, status, hintsRevealed });
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [lessonId, code, status, hintsRevealed]);

  const handleRun = async () => {
    setSubmitResult(null);
    setIsRunning(true);
    setRunOutput(null);
    try {
      const result = await runCode(code);
      setRunOutput(result);
    } catch (err) {
      setRunOutput({ output: [], error: err?.message ?? String(err) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitResult(null);
    setIsRunning(true);
    setRunOutput(null);
    try {
      const [solutionResult, userResult] = await Promise.all([
        runCode(challenge.solution),
        runCode(code),
      ]);
      if (solutionResult.error || userResult.error) {
        setSubmitResult({
          pass: false,
          message: solutionResult.error
            ? `Solution failed to run: ${solutionResult.error}`
            : userResult.error
              ? `Your code failed: ${userResult.error}`
              : "Unexpected error",
        });
        setRunOutput(userResult);
        return;
      }
      const expected = normalizeOutput(solutionResult.output);
      const actual = normalizeOutput(userResult.output);
      const pass = expected === actual;
      setSubmitResult({
        pass,
        message: pass ? "Output matches! Challenge complete." : "Output does not match the expected solution.",
        expected: pass ? undefined : expected,
        actual: pass ? undefined : actual,
      });
      setRunOutput(userResult);
      if (pass) {
        setStatus("completed");
        persist({ status: "completed" });
      }
    } catch (err) {
      const msg = err?.message ?? String(err);
      setSubmitResult({ pass: false, message: `Submit failed: ${msg}` });
      setRunOutput({ output: [], error: msg });
    } finally {
      setIsRunning(false);
    }
  };

  const setWorking = () => {
    const next = status === "in_progress" ? "not_started" : "in_progress";
    setStatus(next);
    persist({ status: next });
  };

  return (
    <div style={{
      background: theme.surfaceLight, border: `1px solid ${theme.border}`,
      borderRadius: 12, padding: 24, marginTop: 24,
      borderLeft: `3px solid ${theme.accent}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>⚔️</span>
        <h3 style={{ margin: 0, fontSize: 18, color: theme.accent, fontFamily: font.display }}>
          CHALLENGE: {challenge.title}
        </h3>
        {status === "completed" && (
          <span style={{ fontSize: 12, color: theme.success, fontFamily: font.code, marginLeft: "auto" }}>
            ✓ Completed
          </span>
        )}
      </div>

      <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
        {challenge.description}
      </p>

      {challenge.javaCode && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: font.code, textTransform: "uppercase" }}>
            Java/Kotlin reference
          </span>
          <CodeBlock code={challenge.javaCode} language="java" maxHeight={200} />
        </div>
      )}

      <div>
        <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: font.code, textTransform: "uppercase" }}>
          Your code
        </span>
        <div style={{
          background: theme.codeBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          overflow: "hidden",
          marginTop: 6,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 12px", borderBottom: `1px solid ${theme.border}`,
            background: "rgba(255,255,255,0.02)",
          }}>
            <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: font.code }}>lua</span>
          </div>
          <div style={{ display: "flex", minHeight: 280, overflow: "hidden" }}>
            <div
              ref={lineNumbersRef}
              onScroll={e => { if (editorRef.current) editorRef.current.scrollTop = e.target.scrollTop; }}
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                width: 36,
                flexShrink: 0,
                minHeight: 280,
                padding: "16px 8px 16px 16px",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: font.code,
                color: theme.textMuted,
                textAlign: "right",
                userSelect: "none",
                borderRight: `1px solid ${theme.border}`,
              }}
            >
              {Array.from({ length: Math.max(1, code.split("\n").length) }, (_, i) => (
                <div key={i} style={{ lineHeight: 1.6 }}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              onScroll={e => { if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop; }}
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                minHeight: 280,
                margin: 0,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: font.code,
                color: theme.text,
                background: "transparent",
                border: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleRun} disabled={isRunning} style={{
          background: theme.accentDim, border: "none", color: "#fff",
          padding: "8px 16px", borderRadius: 6, cursor: isRunning ? "wait" : "pointer",
          fontSize: 13, fontFamily: font.code, transition: "all 0.2s",
        }}>
          {isRunning ? "Running…" : "Run"}
        </button>
        <button onClick={handleSubmit} disabled={isRunning} style={{
          background: theme.success, border: "none", color: "#fff",
          padding: "8px 16px", borderRadius: 6, cursor: isRunning ? "wait" : "pointer",
          fontSize: 13, fontFamily: font.code, transition: "all 0.2s",
        }}>
          Submit
        </button>
        <button onClick={setWorking} style={{
          background: status === "in_progress" ? theme.accentDim : "none",
          border: `1px solid ${status === "in_progress" ? theme.accent : theme.border}`,
          color: status === "in_progress" ? "#fff" : theme.textDim,
          padding: "8px 16px", borderRadius: 6, cursor: "pointer",
          fontSize: 13, fontFamily: font.code, transition: "all 0.2s",
        }}>
          {status === "in_progress" ? "✓ working on it..." : "mark as in progress"}
        </button>
        <button onClick={() => setShowSolution(s => !s)} style={{
          background: "none", border: `1px solid ${showSolution ? theme.success : theme.border}`,
          color: showSolution ? theme.success : theme.textMuted,
          padding: "8px 16px", borderRadius: 6, cursor: "pointer",
          fontSize: 13, fontFamily: font.code, transition: "all 0.2s",
        }}>
          {showSolution ? "hide solution" : "show solution"}
        </button>
      </div>

      {submitResult && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          background: submitResult.pass ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: `1px solid ${submitResult.pass ? theme.success : "#ef4444"}`,
          color: submitResult.pass ? theme.success : "#fca5a5",
          fontSize: 13, fontFamily: font.code,
        }}>
          {submitResult.message}
          {!submitResult.pass && submitResult.expected !== undefined && (
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 4 }}>Expected:</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
                {submitResult.expected || "(no output)"}
              </pre>
              <div style={{ marginTop: 6, marginBottom: 4 }}>Your output:</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
                {submitResult.actual ?? "(no output)"}
              </pre>
            </div>
          )}
        </div>
      )}

      {runOutput !== null && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          background: theme.codeBg, border: `1px solid ${theme.border}`,
          maxHeight: 200, overflow: "auto",
        }}>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: font.code, textTransform: "uppercase" }}>
            Output
          </span>
          <pre style={{
            margin: "8px 0 0", padding: 0, fontSize: 12, fontFamily: font.code,
            color: runOutput.error ? "#fca5a5" : theme.text,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {runOutput.error ? runOutput.error : (runOutput.output?.length > 0 ? runOutput.output.join("\n") : "(no output)")}
          </pre>
        </div>
      )}

      <HintSystem
        hints={challenge.hints}
        initialRevealed={hintsRevealed}
        onReveal={next => persist({ hintsRevealed: next })}
      />

      {showSolution && (
        <div style={{ marginTop: 16 }}>
          <span style={{
            fontSize: 11, color: theme.success, fontFamily: font.code,
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            Solution
          </span>
          <CodeBlock code={challenge.solution} language="lua" maxHeight={500} />
        </div>
      )}
    </div>
  );
}

function LessonView({ lesson, onBack, onProgressChange }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [lesson.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: `1px solid ${theme.border}`,
        background: theme.surface, display: "flex", alignItems: "center", gap: 16,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: `1px solid ${theme.border}`, color: theme.textDim,
          padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: font.code,
          fontSize: 13,
        }}>
          ← back
        </button>
        <div>
          <div style={{ fontSize: 11, color: theme.accentDim, fontFamily: font.code }}>
            LESSON {lesson.id} of {LESSONS.length}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: theme.text, fontFamily: font.display }}>
            {lesson.icon} {lesson.title}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} style={{
        flex: 1, overflow: "auto", padding: "24px 32px",
        maxWidth: 800, width: "100%", margin: "0 auto", boxSizing: "border-box",
      }}>
        {lesson.concepts.map((concept, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h3 style={{
              color: theme.text, fontSize: 16, fontFamily: font.display,
              marginBottom: 12, paddingBottom: 8,
              borderBottom: i === 0 ? "none" : `1px solid ${theme.border}`,
            }}>
              {concept.heading}
            </h3>
            <MarkdownLite text={concept.body} />
          </div>
        ))}

        <Challenge
          key={lesson.id}
          challenge={lesson.challenge}
          lessonId={lesson.id}
          onProgressChange={data => onProgressChange?.(lesson.id, data)}
        />

        {/* Navigation */}
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 32,
          paddingTop: 24, borderTop: `1px solid ${theme.border}`, paddingBottom: 32,
        }}>
          {lesson.id > 1 ? (
            <button onClick={() => onBack("prev", lesson.id - 1)} style={{
              background: "none", border: `1px solid ${theme.border}`, color: theme.textDim,
              padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontFamily: font.code,
            }}>
              ← Lesson {lesson.id - 1}
            </button>
          ) : <div />}
          {lesson.id < LESSONS.length ? (
            <button onClick={() => onBack("next", lesson.id + 1)} style={{
              background: theme.accentDim, border: "none", color: "#fff",
              padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontFamily: font.code,
            }}>
              Lesson {lesson.id + 1} →
            </button>
          ) : (
            <span style={{ color: theme.success, fontFamily: font.code, fontSize: 14 }}>
              🎉 You've completed all lessons!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function LuaLearningApp() {
  const [activeLesson, setActiveLesson] = useState(null);
  const [progressMap, setProgressMap] = useState(() => loadAllProgress());

  const handleNav = (action, id) => {
    if (action === "prev" || action === "next") {
      setActiveLesson(LESSONS.find(l => l.id === id));
    }
  };

  const handleProgressChange = useCallback((lessonId, data) => {
    setProgressMap(prev => ({ ...prev, [lessonId]: data }));
  }, []);

  if (activeLesson) {
    return (
      <div style={{ height: "100vh", background: theme.bg, fontFamily: font.body, color: theme.text }}>
        <LessonView
          key={activeLesson.id}
          lesson={activeLesson}
          onBack={(action, id) => {
            if (action === "prev" || action === "next") handleNav(action, id);
            else setActiveLesson(null);
          }}
          onProgressChange={handleProgressChange}
        />
      </div>
    );
  }

  // ─── Home / Lesson Index ───
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: font.body, color: theme.text }}>
      {/* Hero */}
      <div style={{
        padding: "48px 32px 32px", textAlign: "center",
        background: `linear-gradient(180deg, ${theme.accentGlow} 0%, transparent 100%)`,
      }}>
        <div style={{
          fontFamily: font.display, fontSize: 13, color: theme.accentDim,
          letterSpacing: 3, marginBottom: 12, textTransform: "uppercase",
        }}>
          java → lua • accelerated path
        </div>
        <h1 style={{
          fontSize: 40, margin: "0 0 12px", fontFamily: font.display,
          background: `linear-gradient(135deg, ${theme.accent}, #a78bfa)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: -1,
        }}>
          Learn Lua for Roblox
        </h1>
        <p style={{
          color: theme.textMuted, maxWidth: 520, margin: "0 auto", fontSize: 15,
          lineHeight: 1.6,
        }}>
          8 lessons designed for experienced developers.
          Each lesson builds on the last, with hands-on challenges
          that leverage your Java, Kotlin, and functional programming background.
        </p>
        <div style={{
          display: "flex", gap: 24, justifyContent: "center", marginTop: 20,
          flexWrap: "wrap",
        }}>
          {[
            ["Tables, not Collections", "📦"],
            ["Metatables, not Classes", "🔮"],
            ["Closures over Encapsulation", "🔒"],
            ["Coroutines over Threads", "⚡"],
          ].map(([label, icon], i) => (
            <span key={i} style={{
              fontSize: 12, color: theme.textMuted, fontFamily: font.code,
              background: theme.surface, padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${theme.border}`,
            }}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Lesson Cards */}
      <div style={{
        maxWidth: 680, margin: "0 auto", padding: "24px 24px 64px",
      }}>
        {LESSONS.map((lesson, i) => (
          <button key={lesson.id} onClick={() => setActiveLesson(lesson)} style={{
            display: "flex", alignItems: "flex-start", gap: 20, width: "100%",
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 12, padding: "20px 24px", marginBottom: 12,
            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            position: "relative", overflow: "hidden",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.accentDim;
              e.currentTarget.style.background = theme.surfaceLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.background = theme.surface;
            }}
          >
            {/* Number */}
            <div style={{
              fontFamily: font.display, fontSize: 32, color: theme.accentDim,
              opacity: 0.4, lineHeight: 1, minWidth: 40, textAlign: "center",
              paddingTop: 2,
            }}>
              {String(lesson.id).padStart(2, "0")}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{lesson.icon}</span>
                <h3 style={{
                  margin: 0, fontSize: 17, color: theme.text,
                  fontFamily: font.display,
                }}>
                  {lesson.title}
                </h3>
              </div>
              <p style={{
                margin: "6px 0 0", fontSize: 13, color: theme.textMuted,
                fontFamily: font.code,
              }}>
                {lesson.subtitle}
              </p>
              <div style={{
                marginTop: 8, fontSize: 12, color: theme.textMuted,
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              }}>
                <span>{lesson.concepts.length} concepts • 1 challenge</span>
                {progressMap[lesson.id]?.status === "completed" && (
                  <span style={{ color: theme.success, fontFamily: font.code }}>✓ Completed</span>
                )}
                {progressMap[lesson.id]?.status === "in_progress" && (
                  <span style={{ color: theme.warn, fontFamily: font.code }}>In progress</span>
                )}
              </div>
            </div>

            <div style={{
              color: theme.accentDim, fontSize: 20, alignSelf: "center", opacity: 0.5,
            }}>
              →
            </div>
          </button>
        ))}
      </div>

      {/* Reset progress */}
      <div style={{
        maxWidth: 680, margin: "0 auto", padding: "0 24px 32px", textAlign: "center",
      }}>
        <button
          onClick={clearAllProgress}
          style={{
            background: "none",
            border: `1px solid ${theme.border}`,
            color: theme.textMuted,
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: font.code,
          }}
        >
          Reset all progress (clear localStorage)
        </button>
      </div>
    </div>
  );
}
