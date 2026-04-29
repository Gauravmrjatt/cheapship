'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerUserIcon, Moon02Icon, SunIcon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
	{
		icon: ComputerUserIcon,
		value: 'system',
	},
	{
		icon: SunIcon,
		value: 'light',
	},
	{
		icon: Moon02Icon,
		value: 'dark',
	},
];

export function ToggleTheme() {
	const { theme, setTheme } = useTheme();

	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <div className="flex h-8 w-full" />;
	}

	return (
		<motion.div
			key={String(isMounted)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className="bg-muted flex w-full items-center justify-center overflow-hidden rounded-2xl border "
			role="radiogroup"
		>
			{THEME_OPTIONS.map((option) => (
				<button
					className={cn(
						'relative flex flex-1 cursor-pointer items-center  justify-center rounded-2xl py-1 transition-all',
						theme === option.value
							? 'text-foreground bg-background'
							: 'text-muted-foreground hover:text-foreground',
					)}
					role="radio"
					aria-checked={theme === option.value}
					aria-label={`Switch to ${option.value} theme`}
					onClick={() => setTheme(option.value)}
				>
					{theme === option.value && (
						<motion.div
							layoutId="theme-option"
							transition={{ type: 'spring', bounce: 0.1, duration: 0.75 }}
							className="border-muted-foreground/50 absolute inset-0 rounded-2xl border"
						/>
					)}
					<HugeiconsIcon icon={option.icon} className="size-4" />
				</button>
			))}
		</motion.div>
	);
}