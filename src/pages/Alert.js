import * as React from 'react';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

export default function BasicAlerts(props) {

  function closeAlert(){
    setTimeout(() => {
      props.setAlertOpen("");
    }, 6000); 
  }
  closeAlert();

  return (
    <div className='alert-container'>
        <Stack sx={{ width: '100%', marginLeft: '1rem', marginRight: '1rem', marginBottom: props.marginBottom?props.marginBottom:'0rem'}} spacing={2}>
            <Alert onClose={() => {props.setAlertOpen("")}} variant="outlined" severity={props.severity || props.severity !== ""?props.severity:"success"}>
                {props.altText}
            </Alert>
        </Stack>
    </div>
  );
}