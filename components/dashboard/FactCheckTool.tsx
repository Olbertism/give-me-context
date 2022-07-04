import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { DashboardWidgetProps } from '../../util/types';

export default function FactCheckToolWidget(props: DashboardWidgetProps) {
  console.log('fact check tool props: ', props);

  const [results, setResults] = useState(props.contents);
  const [expanded, setExpanded] = useState(true);

  const displayedContents = props.contents;

  useEffect(() => {
    setResults(displayedContents);
  }, [displayedContents]);

  const handleExpansion = () => setExpanded(!expanded)

  return (
    <section>
      <Accordion expanded={expanded} onClick={() => handleExpansion()}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Google Fact Check Tool results:</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography component='div'>
            {results.map((result) => {
              return result.map((entry) => {
                return (
                  <div key={entry.title}>
                    <div>{entry.title}</div>
                    <div>{entry.url}</div>
                  </div>
                );
              });
            })}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </section>
  );
}
