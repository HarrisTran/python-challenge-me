def solve(s: str) -> int:
    vowels = set("aeiouAEIOU")
    return sum(1 for c in s if c in vowels)
