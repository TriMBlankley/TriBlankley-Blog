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
