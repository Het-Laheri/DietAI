#!/bin/bash
find src -type f -name "*.tsx" -exec sed -i 's/slate-/stone-/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/shadow-sm//g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-green-600/bg-stone-900/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-green-600/text-brand-600/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/bg-green-50/bg-brand-50/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/text-green-700/text-brand-700/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/hover:bg-green-700/hover:bg-stone-800/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/focus:ring-green-500/focus:ring-stone-900/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/focus:border-green-500/focus:border-stone-900/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/rounded-lg/rounded-none/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/rounded-xl/rounded-none/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/rounded-2xl/rounded-none/g' {} +
