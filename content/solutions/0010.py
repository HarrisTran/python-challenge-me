from collections import Counter

def solve(nums: list[int]) -> int:
    counts = Counter(nums)
    return counts.most_common(1)[0][0]
