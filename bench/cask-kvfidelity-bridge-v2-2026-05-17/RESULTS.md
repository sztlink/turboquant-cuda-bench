# CASK × KVFidelity bridge cell v2

Output: `/home/felipe/CASK/experiments/kvfidelity_bridge_v2_20260517-191250`

Status: expanded synthetic action-router bridge; staging, not a global benchmark claim.

## Summary

| run | exact | action | target | rank | target mentioned | eq FullKV | edit dist | norm edit | sec | prefill |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| fullkv | 119/120 | 119/120 | 119/120 | 120/120 | 119/120 | 120/120 | 0.075 | 0.008 | 1.55 | 1586.7 |
| triattention_b512 | 0/120 | 115/120 | 0/120 | 0/120 | 2/120 | 0/120 | 20.8 | 1.0 | 1.836 | 1586.7 |
| triattention_b1024 | 0/120 | 115/120 | 0/120 | 0/120 | 3/120 | 0/120 | 20.8 | 1.0 | 1.715 | 1586.7 |
| triattention_b2048 | 119/120 | 119/120 | 119/120 | 120/120 | 119/120 | 120/120 | 0.075 | 0.008 | 1.796 | 1586.7 |
| cask_b512 | 1/120 | 117/120 | 2/120 | 108/120 | 2/120 | 1/120 | 10.967 | 0.538 | 1.969 | 1586.7 |
| cask_b1024 | 109/120 | 119/120 | 109/120 | 120/120 | 109/120 | 110/120 | 0.9 | 0.045 | 2.084 | 1586.7 |
| cask_b2048 | 119/120 | 119/120 | 119/120 | 120/120 | 119/120 | 120/120 | 0.075 | 0.008 | 1.601 | 1586.7 |

## By case family

| run | family | exact | action | target | rank | edit dist |
|---|---|---:|---:|---:|---:|---:|
| fullkv | action_variety | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | conflicting_correction | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | near_duplicate | 14/15 | 14/15 | 14/15 | 15/15 | 0.6 |
| fullkv | negative_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | rank_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | rank_trap | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | safety_guard | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| fullkv | stale_record | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b512 | action_variety | 0/15 | 11/15 | 0/15 | 0/15 | 21.933 |
| triattention_b512 | conflicting_correction | 0/15 | 15/15 | 0/15 | 0/15 | 26 |
| triattention_b512 | near_duplicate | 0/15 | 14/15 | 0/15 | 0/15 | 19.8 |
| triattention_b512 | negative_control | 0/15 | 15/15 | 0/15 | 0/15 | 20.867 |
| triattention_b512 | rank_control | 0/15 | 15/15 | 0/15 | 0/15 | 20.667 |
| triattention_b512 | rank_trap | 0/15 | 15/15 | 0/15 | 0/15 | 17.6 |
| triattention_b512 | safety_guard | 0/15 | 15/15 | 0/15 | 0/15 | 20.8 |
| triattention_b512 | stale_record | 0/15 | 15/15 | 0/15 | 0/15 | 18.733 |
| triattention_b1024 | action_variety | 0/15 | 11/15 | 0/15 | 0/15 | 21.933 |
| triattention_b1024 | conflicting_correction | 0/15 | 15/15 | 0/15 | 0/15 | 26 |
| triattention_b1024 | near_duplicate | 0/15 | 14/15 | 0/15 | 0/15 | 19.8 |
| triattention_b1024 | negative_control | 0/15 | 15/15 | 0/15 | 0/15 | 20.867 |
| triattention_b1024 | rank_control | 0/15 | 15/15 | 0/15 | 0/15 | 20.667 |
| triattention_b1024 | rank_trap | 0/15 | 15/15 | 0/15 | 0/15 | 17.6 |
| triattention_b1024 | safety_guard | 0/15 | 15/15 | 0/15 | 0/15 | 20.8 |
| triattention_b1024 | stale_record | 0/15 | 15/15 | 0/15 | 0/15 | 18.733 |
| triattention_b2048 | action_variety | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | conflicting_correction | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | near_duplicate | 14/15 | 14/15 | 14/15 | 15/15 | 0.6 |
| triattention_b2048 | negative_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | rank_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | rank_trap | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | safety_guard | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| triattention_b2048 | stale_record | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b512 | action_variety | 0/15 | 13/15 | 0/15 | 13/15 | 15.467 |
| cask_b512 | conflicting_correction | 1/15 | 15/15 | 1/15 | 12/15 | 6.067 |
| cask_b512 | near_duplicate | 0/15 | 14/15 | 0/15 | 14/15 | 6.533 |
| cask_b512 | negative_control | 0/15 | 15/15 | 0/15 | 14/15 | 15.8 |
| cask_b512 | rank_control | 0/15 | 15/15 | 0/15 | 14/15 | 8.933 |
| cask_b512 | rank_trap | 0/15 | 15/15 | 1/15 | 11/15 | 8.2 |
| cask_b512 | safety_guard | 0/15 | 15/15 | 0/15 | 15/15 | 16.467 |
| cask_b512 | stale_record | 0/15 | 15/15 | 0/15 | 15/15 | 10.267 |
| cask_b1024 | action_variety | 14/15 | 15/15 | 14/15 | 15/15 | 0.267 |
| cask_b1024 | conflicting_correction | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b1024 | near_duplicate | 11/15 | 14/15 | 11/15 | 15/15 | 1 |
| cask_b1024 | negative_control | 10/15 | 15/15 | 10/15 | 15/15 | 5.667 |
| cask_b1024 | rank_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b1024 | rank_trap | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b1024 | safety_guard | 14/15 | 15/15 | 14/15 | 15/15 | 0.267 |
| cask_b1024 | stale_record | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | action_variety | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | conflicting_correction | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | near_duplicate | 14/15 | 14/15 | 14/15 | 15/15 | 0.6 |
| cask_b2048 | negative_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | rank_control | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | rank_trap | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | safety_guard | 15/15 | 15/15 | 15/15 | 15/15 | 0 |
| cask_b2048 | stale_record | 15/15 | 15/15 | 15/15 | 15/15 | 0 |

## By target kind

| run | target kind | exact | action | target | rank | edit dist |
|---|---|---:|---:|---:|---:|---:|
| fullkv | compact | 19/20 | 19/20 | 19/20 | 20/20 | 0.45 |
| fullkv | hyphen_long | 20/20 | 20/20 | 20/20 | 20/20 | 0 |
| fullkv | hyphen_short | 21/21 | 21/21 | 21/21 | 21/21 | 0 |
| fullkv | numeric | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| fullkv | path | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| fullkv | snake | 21/21 | 21/21 | 21/21 | 21/21 | 0 |
| triattention_b512 | compact | 0/20 | 18/20 | 0/20 | 0/20 | 9.25 |
| triattention_b512 | hyphen_long | 0/20 | 20/20 | 0/20 | 0/20 | 38.1 |
| triattention_b512 | hyphen_short | 0/21 | 20/21 | 0/21 | 0/21 | 11 |
| triattention_b512 | numeric | 0/19 | 19/19 | 0/19 | 0/19 | 7 |
| triattention_b512 | path | 0/19 | 17/19 | 0/19 | 0/19 | 30.579 |
| triattention_b512 | snake | 0/21 | 21/21 | 0/21 | 0/21 | 28.762 |
| triattention_b1024 | compact | 0/20 | 18/20 | 0/20 | 0/20 | 9.25 |
| triattention_b1024 | hyphen_long | 0/20 | 20/20 | 0/20 | 0/20 | 38.1 |
| triattention_b1024 | hyphen_short | 0/21 | 20/21 | 0/21 | 0/21 | 11 |
| triattention_b1024 | numeric | 0/19 | 19/19 | 0/19 | 0/19 | 7 |
| triattention_b1024 | path | 0/19 | 17/19 | 0/19 | 0/19 | 30.579 |
| triattention_b1024 | snake | 0/21 | 21/21 | 0/21 | 0/21 | 28.762 |
| triattention_b2048 | compact | 19/20 | 19/20 | 19/20 | 20/20 | 0.45 |
| triattention_b2048 | hyphen_long | 20/20 | 20/20 | 20/20 | 20/20 | 0 |
| triattention_b2048 | hyphen_short | 21/21 | 21/21 | 21/21 | 21/21 | 0 |
| triattention_b2048 | numeric | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| triattention_b2048 | path | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| triattention_b2048 | snake | 21/21 | 21/21 | 21/21 | 21/21 | 0 |
| cask_b512 | compact | 0/20 | 19/20 | 0/20 | 19/20 | 6.15 |
| cask_b512 | hyphen_long | 1/20 | 20/20 | 1/20 | 19/20 | 26.1 |
| cask_b512 | hyphen_short | 0/21 | 20/21 | 1/21 | 19/21 | 6 |
| cask_b512 | numeric | 0/19 | 19/19 | 0/19 | 16/19 | 3.421 |
| cask_b512 | path | 0/19 | 18/19 | 0/19 | 17/19 | 12.053 |
| cask_b512 | snake | 0/21 | 21/21 | 0/21 | 18/21 | 11.952 |
| cask_b1024 | compact | 17/20 | 19/20 | 17/20 | 20/20 | 0.95 |
| cask_b1024 | hyphen_long | 16/20 | 20/20 | 16/20 | 20/20 | 2.6 |
| cask_b1024 | hyphen_short | 20/21 | 21/21 | 20/21 | 21/21 | 0.524 |
| cask_b1024 | numeric | 18/19 | 19/19 | 18/19 | 19/19 | 0.053 |
| cask_b1024 | path | 18/19 | 19/19 | 18/19 | 19/19 | 0.053 |
| cask_b1024 | snake | 20/21 | 21/21 | 20/21 | 21/21 | 1.143 |
| cask_b2048 | compact | 19/20 | 19/20 | 19/20 | 20/20 | 0.45 |
| cask_b2048 | hyphen_long | 20/20 | 20/20 | 20/20 | 20/20 | 0 |
| cask_b2048 | hyphen_short | 21/21 | 21/21 | 21/21 | 21/21 | 0 |
| cask_b2048 | numeric | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| cask_b2048 | path | 19/19 | 19/19 | 19/19 | 19/19 | 0 |
| cask_b2048 | snake | 21/21 | 21/21 | 21/21 | 21/21 | 0 |

## Caveat

This v2 is larger and budgeted but still synthetic. It is useful as a bridge/correlation harness, not as a global CASK or TriAttention benchmark.