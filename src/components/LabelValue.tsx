import { Input } from 'antd';

export function LabelValue({
	label,
	value,
}: {
	label: string;
	value?: string;
}) {
	return (
		<div className='flex items-center gap-[12px]'>
			<div className='text-xs text-gray w-[90px]'>{label}</div>
			<div className='text-sm'>{value}</div>
		</div>
	);
}
