import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function SelectLabels(props) {

  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 200}}>
        <InputLabel id="demo-simple-select-helper-label">Course</InputLabel>
        <Select
          labelId="demo-simple-select-helper-label"
          id="demo-simple-select-helper"
          value={props.selectedCourse}
          label="Course"
          onChange={props.handleChange}
        >
          <MenuItem value = "All Courses">
            <em>All Courses</em>
          </MenuItem>
          {props.courses.map(element => <MenuItem value={element.id}>{element.course_name}</MenuItem>)}
        </Select>
        <FormHelperText>Select the specific course to get the images of those course</FormHelperText>
      </FormControl>
    </div>
  );
}