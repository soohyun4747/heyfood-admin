import { Dropdown, Select } from 'antd';
import { CSSProperties } from 'react';

export interface Option {
	value?: string | null;
	label: string;
}

export function LabelDropdown({
	label,
	value,
	options,
	dropdownStyle,
	onChange,
}: {
	label: string;
	value?: string | null;
	options?: Option[];
	dropdownStyle?: CSSProperties;
	onChange?: (value: string) => void;
}) {
	return (
		<div className='flex items-center gap-[12px]'>
			<div className='text-xs text-gray w-[90px]'>{label}</div>
			<Select
				style={{ width: 200, ...dropdownStyle }}
				value={value}
				onChange={onChange}
				options={options}
			/>
		</div>
	);
}
