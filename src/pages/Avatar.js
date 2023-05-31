import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export default function AvatarChips(props) {
  return (
    <div className='avatar-container'>
        <Stack direction="row" spacing={1}>
            <Chip
                avatar={<Avatar alt="Unknown User" src={props.imageUrl} />}
                label={props.name}
                variant="outlined"
            />
        </Stack>
    </div>

  );
}