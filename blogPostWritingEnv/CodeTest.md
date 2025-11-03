I may want to display code snippets, or show the workflow i am usign when writing or looking at code in the futire, with this in mind i want to be able to allow users to view code in clearly deliminated code-blocks, with syntax highlighting dependend on the code language.

It should also be easy to copy an entire code block with little to no difficulty.

Below are code blocks of different languages to show the Syntax-highlighting:

## Rust Code:

```rust
#[derive(PartialEq, Eq, Clone, Copy, Debug)]
enum Move {
    Rock = 1,
    Paper = 2,
    Scissors = 3,
}

impl Move {
    pub fn new(n: u32) -> Self {
        match n {
            0 => Move::Rock,
            1 => Move::Paper,
            2 => Move::Scissors,
            _ => panic!("{}", n),
        }
    }

    pub fn beater(self) -> Self {
        match self {
            Move::Rock => Move::Paper,
            Move::Paper => Move::Scissors,
            Move::Scissors => Move::Rock,
        }
    }

    pub fn loser(self) -> Self {
        // I'm lazy lol
        self.beater().beater()
    }
}
```

## C Code:

```c
#define ARENA_SIZE (48l * 1024 * 1024 * 1024)

/* An arena object. */
#ifdef __clang__
void *arena_top;
#else
register void *arena_top asm("r15");
#endif
void *arena_base;

/* Allocate some memory on an arena, without aligning. */
FN void *arena_alloc_unaligned(size_t sz) {
  void *result = arena_top;
  arena_top += sz;
  return result;
}

/* Allocate some memory on an arena. */
FN void *arena_alloc(size_t sz) {
  uintptr_t top = (uintptr_t)arena_top;
  top += sizeof(size_t) - 1;
  top &= ~(sizeof(size_t) - 1);
  arena_top = (void *)top;
  return arena_alloc_unaligned(sz);
}
```

## Haskell Code:

```haskell
data RexElem
  = RexChar Char
  | RexWildcard
  | RexRepeated RexElem
  deriving (Show)

rexMatch :: [RexElem] -> String -> Bool
rexMatch [] [] = True
rexMatch (el : els) (c : cs) = case el of
  RexChar rc -> rc == c && rexMatch els cs
  RexWildcard -> rexMatch els cs
  RexRepeated rr -> rexMatch els (c : cs) || rexMatch (rr : el : els) (c : cs)
rexMatch _ _ = False

parseRex :: String -> [RexElem]
parseRex "" = []
parseRex (c : cs) =
  let baseElem = case c of
        '.' -> RexWildcard
        _ -> RexChar c
      (elem, rest) = parseRexRepeated baseElem cs
   in elem : parseRex rest
  where
    parseRexRepeated :: RexElem -> String -> (RexElem, String)
    parseRexRepeated el ('*' : rest) = parseRexRepeated (RexRepeated el) rest
    parseRexRepeated el rest = (el, rest)
```

## Python Code:

```python
if headless:
    options.add_argument('--headless')
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                     "AppleWebKit/537.36 (KHTML, like Gecko) "
                     "Chrome/87.0.4280.88 Safari/537.36")

driver = webdriver.Chrome(options=options, executable_path=binary_path)


async def start_server():
    """ Starts the server by clicking on the start button.
        The try except part tries to find the confirmation button, and if it
        doesn't, it continues to loop until the confirm button is clicked."""
    element = driver.find_element_by_xpath("//*[@id=\"start\"]")
    element.click()
    await asyncio.sleep(3)
    # hides the notification question
    driver.execute_script('hideAlert();')
    # server state span
    state = driver.find_element_by_xpath('//*[@id="nope"]/main/section/div[3]'
                                         '/div[3]/div[1]/div/span[2]/span')
```

        {"postGroup":{"groupId":"68fd9a0495708ea234d1a4ec","groupName":"Blog Architecture","groupColor":"#cdab8f","sequence":0},"_id":"69080ea4464de2c51b9d87e1","postId":8,"postTitle":"Code-Focused Post Showcase","postAuthor":"Tri Blankley, Alex Bethel","postDate":"Nov 2, 2025","postContent":"I may want to display code snippets, or show the workflow i am usign when writing or looking at code in the futire, with this in mind i want to be able to allow users to view code in clearly deliminated code-blocks, with syntax highlighting dependend on the code language.\n\nIt should also be easy to copy an entire code block with little to no difficulty.\n\nBelow are code blocks of different languages to show the Syntax-highlighting:\n\n## Rust Code:\n\n```rust\n#[derive(PartialEq, Eq, Clone, Copy, Debug)]\nenum Move {\n    Rock = 1,\n    Paper = 2,\n    Scissors = 3,\n}\n\nimpl Move {\n    pub fn new(n: u32) -> Self {\n        match n {\n            0 => Move::Rock,\n            1 => Move::Paper,\n            2 => Move::Scissors,\n            _ => panic!(\"{}\", n),\n        }\n    }\n\n    pub fn beater(self) -> Self {\n        match self {\n            Move::Rock => Move::Paper,\n            Move::Paper => Move::Scissors,\n            Move::Scissors => Move::Rock,\n        }\n    }\n\n    pub fn loser(self) -> Self {\n        // I'm lazy lol\n        self.beater().beater()\n    }\n}\n```\n\n## C Code:\n\n```c\n#define ARENA_SIZE (48l * 1024 * 1024 * 1024)\n\n/* An arena object. */\n#ifdef __clang__\nvoid *arena_top;\n#else\nregister void *arena_top asm(\"r15\");\n#endif\nvoid *arena_base;\n\n/* Allocate some memory on an arena, without aligning. */\nFN void *arena_alloc_unaligned(size_t sz) {\n  void *result = arena_top;\n  arena_top += sz;\n  return result;\n}\n\n/* Allocate some memory on an arena. */\nFN void *arena_alloc(size_t sz) {\n  uintptr_t top = (uintptr_t)arena_top;\n  top += sizeof(size_t) - 1;\n  top &= ~(sizeof(size_t) - 1);\n  arena_top = (void *)top;\n  return arena_alloc_unaligned(sz);\n}\n```\n\n## Haskell Code:\n\n```haskell\ndata RexElem\n  = RexChar Char\n  | RexWildcard\n  | RexRepeated RexElem\n  deriving (Show)\n\nrexMatch :: [RexElem] -> String -> Bool\nrexMatch [] [] = True\nrexMatch (el : els) (c : cs) = case el of\n  RexChar rc -> rc == c && rexMatch els cs\n  RexWildcard -> rexMatch els cs\n  RexRepeated rr -> rexMatch els (c : cs) || rexMatch (rr : el : els) (c : cs)\nrexMatch _ _ = False\n\nparseRex :: String -> [RexElem]\nparseRex \"\" = []\nparseRex (c : cs) =\n  let baseElem = case c of\n        '.' -> RexWildcard\n        _ -> RexChar c\n      (elem, rest) = parseRexRepeated baseElem cs\n   in elem : parseRex rest\n  where\n    parseRexRepeated :: RexElem -> String -> (RexElem, String)\n    parseRexRepeated el ('*' : rest) = parseRexRepeated (RexRepeated el) rest\n    parseRexRepeated el rest = (el, rest)\n```\n\n## Python Code:\n\n```python\nif headless:\n    options.add_argument('--headless')\noptions.add_argument(\"user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) \"\n                     \"AppleWebKit/537.36 (KHTML, like Gecko) \"\n                     \"Chrome/87.0.4280.88 Safari/537.36\")\n\ndriver = webdriver.Chrome(options=options, executable_path=binary_path)\n\n\nasync def start_server():\n    \"\"\" Starts the server by clicking on the start button.\n        The try except part tries to find the confirmation button, and if it\n        doesn't, it continues to loop until the confirm button is clicked.\"\"\"\n    element = driver.find_element_by_xpath(\"//*[@id=\\\"start\\\"]\")\n    element.click()\n    await asyncio.sleep(3)\n    # hides the notification question\n    driver.execute_script('hideAlert();')\n    # server state span\n    state = driver.find_element_by_xpath('//*[@id=\"nope\"]/main/section/div[3]'\n                                         '/div[3]/div[1]/div/span[2]/span')\n```\n        ","contentType":"Code","postTopics":["Digital Hobbies"],"isPublished":true,"attachedFiles":[],"__v":0}
