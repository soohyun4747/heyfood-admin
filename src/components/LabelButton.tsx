import { Button, Input } from 'antd';

export function LabelButton({
	label,
	buttonLabel,
	onClick,
}: {
	label: string;
	buttonLabel: string;
	onClick?: React.MouseEventHandler<HTMLElement> | undefined;
}) {
	return (
		<div className='flex items-center gap-[12px]'>
			<div className='text-xs text-gray w-[90px]'>{label}</div>
			<Button onClick={onClick}>{buttonLabel}</Button>
		</div>
	);
}
