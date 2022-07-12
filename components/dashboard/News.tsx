/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { List, ListItem, ListItemText, Pagination } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import arrayShuffle from 'array-shuffle';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { accordionHeadlineStyles } from '../../styles/customStyles';
import {
  DashboardWidgetProps,
  DashboardWidgetPropsContents,
  NestedDashboardWidgetProps,
} from '../../util/types';
import usePagination from './Pagination';

const collectAndShuffleResults = (nestedArray: DashboardWidgetPropsContents[][]) => {
  const outputArray = [] as DashboardWidgetPropsContents[];
  nestedArray.map((subarray) => {
    return subarray.map((entry) => {
      return outputArray.push(entry);
    });
  });
  const shuffledArray = arrayShuffle(outputArray);
  return shuffledArray;
};

export default function NewsWidget(props: NestedDashboardWidgetProps) {
  const [results, setResults] = useState<DashboardWidgetPropsContents[]>([]);
  const [paginationCount, setPaginationCount] = useState<number>(0);
  const [page, setPage] = useState(1);

  const displayedContents = props.contents;

  useEffect(() => {
    setResults(collectAndShuffleResults(displayedContents));
  }, [displayedContents]);

  const perPage = 5;

  useEffect(() => {
    setPaginationCount(Math.ceil(results.length / perPage));
  }, [results]);

  const paginatedData = usePagination(results, perPage);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    paginatedData.jump(value);
  };

  return (
    <section>
      <Accordion>
        <AccordionSummary
          css={accordionHeadlineStyles}
          expandIcon={<ExpandMoreIcon color="secondary" />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Recent news results:</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List sx={{ width: '100%' }}>
            {paginatedData.currentData().map((result) => {
              return (
                <ListItem alignItems="flex-start" key={result.title}>
                  <ListItemText
                    primary={result.title}
                    secondary={
                      <Link href={result.url} target="_blank" rel="noreferrer">
                        {result.url}
                      </Link>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
          <Pagination
            count={paginationCount}
            page={page}
            onChange={handlePageChange}
          />
        </AccordionDetails>
      </Accordion>
    </section>
  );
}
