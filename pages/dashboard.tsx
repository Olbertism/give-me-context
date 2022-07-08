import FeedIcon from '@mui/icons-material/Feed';
import {
  Box,
  Button,
  Grid,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import arrayShuffle from 'array-shuffle';
import Fuse from 'fuse.js';
import { useEffect, useRef, useState } from 'react';
import DatabaseWidget from '../components/dashboard/DbSearchResults';
import FactCheckToolWidget from '../components/dashboard/FactCheckTool';
import NewsWidget from '../components/dashboard/News';
import SearchEngineWidget from '../components/dashboard/SearchEngine';
import WikipediaWidget from '../components/dashboard/Wikipedia';
import CircularIndeterminate from '../components/layout/ProgressCircle';
import { greenTextHighlight, redTextHighlight } from '../styles/customStyles';
import { getAllClaimsForSearch } from '../util/database/database';
import { fetchResources } from '../util/fetchers/mainFetcher';
import generateRoBERTaPrompts from '../util/robertaPromptsProcessor';

type DbClaim = {
  id: number;
  title: string;
  description: string;
};

type DashboardProps = {
  claims: DbClaim[];
};

type FormattedResource = {
  title: any;
  url: any;
  promptSource: string;
  prediction?: number;
};

export default function Dashboard(props: DashboardProps) {
  console.log('dashboard props', props);

  const [searchQuery, setSearchQuery] = useState('');

  const [loadingResources, setLoadingResources] = useState(false);

  const [fetchedResources, setFetchedResources] = useState([]);
  const [formattedResources, setFormattedResources] = useState<
    FormattedResource[][]
  >([]);
  const [evaluation, setEvaluation] = useState('');
  const [displayedResources, setDisplayedResources] = useState([]);
  const [modelContradictions, setModelContradictions] = useState([]);
  const [modelAgreements, setModelAgreements] = useState([]);
  const [displayPredictions, setDisplayPredictions] = useState(false);

  const [loadingRoBERTa, setLoadingRoBERTa] = useState(false);
  const [roBERTaError, setRoBERTaError] = useState('');

  const [dbClaimsSearchResults, setDbClaimsSearchResults] =
    useState<FuseResult>([]);

  // console.log('fetchedResources: ', fetchedResources);
  console.log('formattedResources: ', formattedResources);

  const searchQueryInput = useRef(null);

  const dbClaimsSearchIndex = new Fuse<DbClaim>(props.claims, {
    includeScore: true,
    threshold: 0.4,
    keys: ['title', 'description'],
  });

  function handleDBSearch() {
    const results = dbClaimsSearchIndex.search(searchQuery);
    console.log('fuse results', results);
    const sorteddbClaimsSearchResults = results.sort((resultA, resultB) => {
      return resultA.score - resultB.score;
    });
    console.log('sorted Fuse results', sorteddbClaimsSearchResults);
    setDbClaimsSearchResults(sorteddbClaimsSearchResults);
  }

  async function handleFetchResources() {
    const [resources, shortedData] = await fetchResources(searchQuery);
    setFetchedResources(resources);
    setFormattedResources(shortedData);
    setLoadingResources(false);
  }

  async function handleGenerateRoBERTaPrompts() {
    if (formattedResources.length === 0 || !searchQuery) {
      console.log('Tried to generate prompts without query or resources');
      return;
    }

    const prompts = [];
    for (let resource of formattedResources) {
      for (let entry of resource) {
        prompts.push([searchQuery, entry.promptSource]);
      }
    }

    console.log('prompts handed over: ', prompts);

    // for tests
    const roBERTaRequestBody = {
      prompts: prompts,
      /*  [
      [
          "Mars is a planet",
          "Mars is a planet"
      ],
      [
          "Mars is a planet",
          "Mars is not a planet"
      ]] */
    };
    const fetchedPredictions = await fetch('/api/robertaPredictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roBERTaRequestBody),
    }).then((response) => response.json());
    console.log('RoBERTa response', fetchedPredictions);

    if (fetchedPredictions.status === 'error') {
      setRoBERTaError(fetchedPredictions.message);
      setLoadingRoBERTa(false);
      return;
    }

    // call function to combine fetched Resources with fetched Predictions

    // improve handling and storage of prediction resource display!!
    const combinedResources = formattedResources.slice();
    const conclusio = { contradict: 0, agree: 0 };

    const contradictions = [];
    const agreements = [];

    for (let sources of combinedResources) {
      for (let source of sources) {
        source.prediction = fetchedPredictions.predictions.shift();

        if (source.prediction === 0) {
          contradictions.push(source);
          conclusio.contradict += 1;
        } else if (source.prediction === 2) {
          agreements.push(source);
          conclusio.agree += 1;
        }
      }
    }

    const shuffledContradictions = arrayShuffle(contradictions);
    const shuffledAgreements = arrayShuffle(agreements);

    console.log('combinedResources', combinedResources);
    console.log('conclusio', conclusio);

    const modelEvaluation = `The claim seems to ${
      conclusio.contradict > conclusio.agree ? 'contradict' : 'agree'
    } with the found sources (extent: ${
      conclusio.contradict > conclusio.agree
        ? (conclusio.contradict / (conclusio.contradict + conclusio.agree)) *
          100
        : (conclusio.agree / (conclusio.contradict + conclusio.agree)) * 100
    }%)`;

    setEvaluation(modelEvaluation);

    // this needs to change
    setDisplayedResources(combinedResources);

    setModelAgreements(shuffledAgreements);
    setModelContradictions(shuffledContradictions);

    setDisplayPredictions(true);
    setLoadingRoBERTa(false);
  }

  return (
    <main>
      <Typography variant="h1">Check Claim</Typography>

      <div>
        <section>
          <Grid container spacing={2} sx={{ marginBottom: '40px' }}>
            <Grid item md={6}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item md={8}>
                    <TextField
                      fullWidth
                      label="Enter a claim"
                      size="small"
                      value={searchQuery}
                      ref={searchQueryInput}
                      onChange={(event) => {
                        setSearchQuery(event.currentTarget.value);
                      }}
                    />
                  </Grid>
                  <Grid item md={4}>
                    <Button
                      disabled={loadingResources}
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        setDisplayPredictions(false);
                        setLoadingResources(true);
                        handleDBSearch();
                        handleFetchResources().catch((error) => {
                          console.log(
                            'An error occured with one or more fetched resources',
                            error,
                          );
                        });
                      }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item md={6} />
          </Grid>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <Box
                sx={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  mb: '40px',
                }}
              >
                <Typography>Check claim against search results</Typography>
                <Button
                  disabled={
                    (formattedResources.length === 0 ? true : false) ||
                    loadingRoBERTa
                  }
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    setRoBERTaError('');
                    setDisplayPredictions(false);
                    setLoadingRoBERTa(true);
                    handleGenerateRoBERTaPrompts().catch(() => {
                      console.log(
                        'An error occured trying to generate RoBERTa results',
                      );
                      setRoBERTaError('No valid response received');
                      setLoadingRoBERTa(false);
                    });
                  }}
                >
                  Run
                </Button>
              </Box>
            </Grid>
            <Grid item md={6} />
          </Grid>

          {displayPredictions ? (
            <>
              <Typography>{evaluation}</Typography>
              <Grid container spacing={2}>
                <Grid item md={6}>
                  <Typography
                    variant="h3"
                    component="h3"
                    hidden={
                      modelAgreements.length === 0 &&
                      modelContradictions.length === 0
                        ? true
                        : false
                    }
                  >
                    Taglines that{' '}
                    <Box component="span" sx={redTextHighlight}>
                      contradict
                    </Box>{' '}
                    claim:
                  </Typography>
                  <List sx={{ width: '100%', maxWidth: 600 }}>
                    {modelContradictions.map((source) => {
                      return (
                        <ListItem alignItems="flex-start" key={source.title}>
                          <ListItemIcon>
                            <FeedIcon />
                          </ListItemIcon>

                          <ListItemText
                            primary={source.title}
                            secondary={
                              <Link
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.url}
                              </Link>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>
                <Grid item md={6}>
                  <Typography
                    variant="h3"
                    component="h3"
                    hidden={
                      modelAgreements.length === 0 &&
                      modelContradictions.length === 0
                        ? true
                        : false
                    }
                  >
                    Taglines that{' '}
                    <Box component="span" sx={greenTextHighlight}>
                      agree
                    </Box>{' '}
                    with claim:
                  </Typography>
                  <List sx={{ width: '100%', maxWidth: 600 }}>
                    {modelAgreements.map((source) => {
                      return (
                        <ListItem alignItems="flex-start" key={source.title}>
                          <ListItemIcon>
                            <FeedIcon />
                          </ListItemIcon>

                          <ListItemText
                            primary={source.title}
                            secondary={
                              <Link
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.url}
                              </Link>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>
              </Grid>
            </>
          ) : null}

          <div>
            {loadingRoBERTa ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  <CircularIndeterminate />
                </Box>

                <Grid container spacing={2} sx={{ mb: '30px' }}>
                  <Grid item md={6}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item md={6}>
                    <Skeleton variant="text" />
                  </Grid>
                </Grid>
              </>
            ) : null}
          </div>
          {roBERTaError !== '' ? <p>{roBERTaError}</p> : null}
        </section>
        {loadingResources ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <CircularIndeterminate />
          </Box>
        ) : null}
        {formattedResources.length === 0 ? null : (
          <Box sx={{ flexGrow: 1, mb: '30px' }}>
            <Grid container spacing={2}>
              <Grid item sm={12} md={4}>
                <DatabaseWidget contents={dbClaimsSearchResults} />
              </Grid>
              <Grid item sm={12} md={8}>
                <FactCheckToolWidget
                  query={searchQuery}
                  contents={formattedResources[0]}
                />
              </Grid>
              <Grid item sm={12} md={8}>
                <NewsWidget
                  query={searchQuery}
                  contents={formattedResources.slice(3)}
                />
              </Grid>
              <Grid item sm={12} md={4}>
                <WikipediaWidget
                  query={searchQuery}
                  contents={formattedResources[2]}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* <SearchEngineWidget
          query={searchQuery}
          contents={formattedResources.slice(1, 2)}
        /> */}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  const claims = await getAllClaimsForSearch();

  return { props: { claims: claims } };
}
