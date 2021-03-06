import { AddCircle, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Rating,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { theme } from '../../styles/theme';
import {
  checkIfAuthorExists,
  getAllLabels,
  getAllVerdicts,
  getUserByValidSessionToken,
} from '../../util/database/database';
import {
  handleAuthorCreation,
  handleReviewCreation,
  handleSourcesCreation,
} from '../../util/handlers';
import {
  ClaimLabelRequestbody,
  ClaimRequestbody,
  Label,
  LabelRequestbody,
  RatingRequestbody,
  Verdict,
} from '../../util/types';

type Props = {
  refreshUserProfile: () => Promise<void>;
  author?: any;
  verdicts: Verdict[];
  labels: Label[];
};

const ratingLabels: { [index: string]: string } = {
  1: 'Completly untrue',
  2: 'Low credibility',
  3: 'Debatable',
  4: 'Mostly factual',
  5: 'Factual',
};

const handleClaimCreation = async (
  newClaimTitle: string,
  newClaimDescription: string,
  authorId: number,
) => {
  const requestbody: ClaimRequestbody = {
    title: newClaimTitle,
    description: newClaimDescription,
    authorId: authorId,
  };

  const response = await fetch('/api/createClaim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestbody),
  });
  const claim = await response.json();
  return claim;
};

const handleCreateLabel = async (
  dbLabels: Label[],
  enteredLabels: string[],
  claimId: number,
) => {
  const currentLabels = dbLabels;
  const existingLabels = new Set();
  for (const label of enteredLabels) {
    for (const currentLabel of currentLabels) {
      if (label === currentLabel.label) {
        // create only claim_labels entry
        const requestbody: ClaimLabelRequestbody = {
          claimId: claimId,
          labelId: currentLabel.id,
        };
        // const response =
        await fetch('/api/createClaimLabel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestbody),
        });
        existingLabels.add(label);
        break;
      }
    }
    if (!existingLabels.has(label)) {
      // create new label and claim_labels entry
      const requestbodyNewLabel: LabelRequestbody = {
        newLabel: label,
      };
      console.log(requestbodyNewLabel);
      const responseNewLabel = await fetch('/api/createLabel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestbodyNewLabel),
      });
      const newLabel = await responseNewLabel.json();
      const requestbodyClaimLabel: ClaimLabelRequestbody = {
        claimId: claimId,
        labelId: newLabel.label.id,
      };
      // const responseClaimLabel =
      await fetch('/api/createClaimLabel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestbodyClaimLabel),
      });
    }
  }
};

const handleRatingCreation = async (
  claimId: number,
  ratingValue: number,
  authorId: number,
) => {
  const requestbody: RatingRequestbody = {
    claimId: claimId,
    ratingValue: ratingValue,
    authorId: authorId,
  };

  const response = await fetch('/api/createRating', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestbody),
  });
  const rating = await response.json();
  return rating;
};

function getRatingLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${ratingLabels[value]}`;
}

export default function Contribute(props: Props) {
  const [authorId, setAuthorId] = useState<number | undefined>(
    props.author === null ? undefined : props.author.id,
  );

  const [newClaimTitle, setNewClaimTitle] = useState('');
  const [newClaimDescription, setNewClaimDescription] = useState('');

  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewDescription, setNewReviewDescription] = useState('');

  const [selectedVerdict, setSelectedVerdict] = useState<number | string>('');

  const [selectedLabel, setSelectedLabel] = useState('');
  const [savedLabels, setSavedLabels] = useState<string[]>([]);

  const [addReviewCheckbox, setAddReviewCheckbox] = useState(false);

  const [ratingValue, setRatingValue] = useState<number | null>(0);
  const [ratingHover, setRatingHover] = useState(-1);

  const [newSourceInput, setNewSourceInput] = useState(false);

  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [currentSourceList, setCurrentSourceList] = useState<
    { title: string; url: string }[]
  >([]);
  const [sourceUrlError, setSourceUrlError] = useState(false);

  const [displayAlert, setDisplayAlert] = useState(false);

  const [errors, setErrors] = useState<Error[]>([]);

  const refreshUserProfile = props.refreshUserProfile;

  useEffect(() => {
    refreshUserProfile().catch(() =>
      console.log('refresh user profile failed'),
    );
  }, [refreshUserProfile]);

  const appendError = (error: Error) => {
    const errorList = [...errors, error];
    setErrors(errorList);
  };

  const clearInputs = () => {
    setNewClaimTitle('');
    setNewClaimDescription('');
    setNewReviewTitle('');
    setNewReviewDescription('');
    setSourceTitle('');
    setSourceUrl('');
    setCurrentSourceList([]);
    setSelectedVerdict('');
    setRatingValue(0);
    setSelectedLabel('');
    setSavedLabels([]);
  };

  const handleSaveLabel = () => {
    const updatedSavedLabels = [...savedLabels, selectedLabel];
    setSavedLabels(updatedSavedLabels);
    setSelectedLabel('');
  };

  const handleSaveSource = () => {
    const updatedSourceList = [
      ...currentSourceList,
      { title: sourceTitle, url: sourceUrl },
    ];
    setCurrentSourceList(updatedSourceList);
    setSourceTitle('');
    setSourceUrl('');
    setNewSourceInput(false);
  };

  const handleValidation = () => {
    if (sourceUrl.slice(0, 4) !== 'http') {
      setSourceUrlError(true);
      return false;
    }
    return true;
  };

  return (
    <>
      <Head>
        <title>Add Database entry</title>
        <meta name="description" content="Add entry" />
      </Head>

      <main>
        <Typography variant="h1" data-test-id="add-claim-h1">
          Add a claim to the database
        </Typography>

        <section>
          <Typography variant="h2">New claim</Typography>
          <Box sx={{ marginBottom: '30px' }}>
            <TextField
              sx={{ minWidth: '280px' }}
              label="Claim title"
              size="small"
              multiline
              required
              inputProps={{
                'data-test-id': 'claim-title',
              }}
              value={newClaimTitle}
              onChange={(event) => {
                setNewClaimTitle(event.currentTarget.value);
              }}
            />
          </Box>
          <Box sx={{ marginBottom: '30px' }}>
            <TextField
              label="Description"
              required
              multiline
              rows={9}
              fullWidth
              inputProps={{
                'data-test-id': 'claim-description',
              }}
              value={newClaimDescription}
              onChange={(event) => {
                setNewClaimDescription(event.currentTarget.value);
              }}
            />
          </Box>
          <Box
            sx={{
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              label="Labels"
              size="small"
              inputProps={{
                'data-test-id': 'claim-label-input',
              }}
              value={selectedLabel}
              onChange={(event) => {
                setSelectedLabel(event.currentTarget.value);
              }}
            />
            {selectedLabel === '' ? (
              <div />
            ) : (
              <IconButton
                aria-label="Save label entry"
                data-test-id="claim-save-label"
                onClick={() => handleSaveLabel()}
              >
                <Save />
              </IconButton>
            )}
            {savedLabels.length === 0 ? (
              <Typography sx={{ marginLeft: '10px', marginRight: '10px' }}>
                No labels set
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {savedLabels.map((savedLabel) => {
                  return (
                    <Chip
                      label={savedLabel}
                      key={savedLabel}
                      sx={{
                        bgcolor: theme.palette.primary.light,
                        color: 'white',
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
          <Box sx={{ marginBottom: '50px' }}>
            <Typography>Credibility rating for claim</Typography>
            <Rating
              name="Claim Rating"
              value={ratingValue}
              precision={1}
              getLabelText={getRatingLabelText}
              onChange={(event, newValue) => {
                setRatingValue(newValue);
              }}
              onChangeActive={(event, newRatingHover) =>
                setRatingHover(newRatingHover)
              }
              // emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
            />
            {ratingValue !== null && (
              <Box sx={{ position: 'absolute' }}>
                {ratingLabels[ratingHover !== -1 ? ratingHover : ratingValue]}
              </Box>
            )}
          </Box>

          <Typography variant="h2">Review for claim</Typography>
          <Box sx={{ display: 'flex' }}>
            <p>Attach a review?</p>
            <Checkbox
              onChange={() => {
                setAddReviewCheckbox(!addReviewCheckbox);
              }}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          </Box>

          <Box sx={{ marginBottom: '30px' }}>
            <TextField
              label="Review title"
              size="small"
              sx={{ minWidth: '280px' }}
              disabled={!addReviewCheckbox}
              multiline
              required
              value={newReviewTitle}
              onChange={(event) => {
                setNewReviewTitle(event.currentTarget.value);
              }}
            />
          </Box>
          <Box sx={{ marginBottom: '30px' }}>
            <TextField
              label="Review description"
              disabled={!addReviewCheckbox}
              required
              multiline
              rows={9}
              fullWidth
              value={newReviewDescription}
              onChange={(event) => {
                setNewReviewDescription(event.currentTarget.value);
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '20px',
              flexWrap: 'wrap',
            }}
          >
            <Typography>Add source</Typography>
            <IconButton
              sx={{ mb: '5px' }}
              disabled={!addReviewCheckbox}
              aria-label="Add source"
              onClick={() => setNewSourceInput(true)}
            >
              <AddCircle />
            </IconButton>

            <Box>
              {newSourceInput ? (
                <Box sx={{ display: 'flex', gap: '15px' }}>
                  <TextField
                    label="Source title"
                    size="small"
                    required
                    value={sourceTitle}
                    onChange={(event) => {
                      setSourceTitle(event.currentTarget.value);
                    }}
                  />
                  <TextField
                    error={sourceUrlError}
                    label="Source URL"
                    size="small"
                    required
                    value={sourceUrl}
                    helperText="Start with http or https"
                    onChange={(event) => {
                      setSourceUrl(event.currentTarget.value);
                    }}
                  />
                  <IconButton
                    disabled={sourceTitle === '' || sourceUrl === ''}
                    aria-label="Save source entry"
                    onClick={() => {
                      setSourceUrlError(false);
                      if (!handleValidation()) {
                        return;
                      }
                      handleSaveSource();
                    }}
                  >
                    <Save />
                  </IconButton>
                </Box>
              ) : null}
            </Box>
          </Box>
          <Box sx={{ mb: '15px' }}>
            {' '}
            {currentSourceList.length === 0 ? (
              <Typography>Currently no sources provided</Typography>
            ) : (
              <>
                <Typography variant="h5">Sources:</Typography>

                <List sx={{ width: '100%' }}>
                  {currentSourceList.map((source) => {
                    return (
                      <ListItem alignItems="flex-start" key={source.title}>
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
              </>
            )}
          </Box>
          <Box sx={{ maxWidth: '320px', mb: '30px' }}>
            <FormControl fullWidth>
              <InputLabel id="verdict-select-label">Verdict</InputLabel>
              <Select
                disabled={!addReviewCheckbox}
                labelId="verdict-select-label"
                id="verdict-select"
                value={selectedVerdict}
                label="Verdict"
                onChange={(event) => {
                  setSelectedVerdict(Number(event.target.value));
                }}
              >
                {props.verdicts.map(({ verdict, id }) => {
                  return (
                    <MenuItem key={verdict} value={id}>
                      {verdict}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          <Button
            sx={{ mb: '30px' }}
            disabled={
              newClaimTitle === '' ||
              newClaimDescription === '' ||
              (addReviewCheckbox &&
                (newReviewTitle === '' || newReviewDescription === ''))
            }
            data-test-id="claim-submit-btn"
            variant="contained"
            color="secondary"
            onClick={async () => {
              setErrors([]);

              let requestAuthorId;
              if (!authorId) {
                const { author } = await handleAuthorCreation();

                if (!author) {
                  console.log(
                    'An error ocurred while trying to create a new author',
                  );
                  return;
                }
                setAuthorId(author.id);
                requestAuthorId = author.id;
              } else {
                requestAuthorId = authorId;
              }

              const wrappedClaim = await handleClaimCreation(
                newClaimTitle,
                newClaimDescription,
                requestAuthorId,
              ).catch((error) => {
                console.log('Error when trying to create new claim');
                appendError(error);
              });
              if (!wrappedClaim) {
                setDisplayAlert(true);
                return;
              }
              const { claim } = wrappedClaim;

              if (savedLabels.length > 0) {
                handleCreateLabel(props.labels, savedLabels, claim.id).catch(
                  (error) => {
                    console.log('Error when trying to create new label');
                    appendError(error);
                  },
                );
              }
              if (Number(ratingValue) > 0) {
                handleRatingCreation(
                  claim.id,
                  ratingValue!,
                  requestAuthorId,
                ).catch((error) => {
                  console.log('Error when trying to create new rating');
                  appendError(error);
                });
              }
              if (addReviewCheckbox) {
                const wrappedReview = await handleReviewCreation(
                  newReviewTitle,
                  newReviewDescription,
                  requestAuthorId,
                  claim.id,
                  selectedVerdict,
                ).catch((error) => {
                  console.log('Error when trying to create new review');
                  appendError(error);
                });
                if (!wrappedReview) {
                  setDisplayAlert(true);
                  return;
                }
                const { review } = wrappedReview;
                if (currentSourceList.length > 0) {
                  handleSourcesCreation(review.id, currentSourceList).catch(
                    (error) => {
                      console.log('Error when trying to create new sources');
                      appendError(error);
                    },
                  );
                }
              }
              if (errors.length === 0) {
                clearInputs();
              }
              setDisplayAlert(true);
            }}
          >
            Submit
          </Button>

          <Snackbar
            open={displayAlert}
            autoHideDuration={5000}
            onClose={(
              event?: React.SyntheticEvent | Event,
              reason?: string,
            ) => {
              if (reason === 'clickaway') {
                return;
              }
              setDisplayAlert(false);
            }}
          >
            {errors.length > 0 ? (
              <Alert
                onClose={(
                  event?: React.SyntheticEvent | Event,
                  reason?: string,
                ) => {
                  if (reason === 'clickaway') {
                    return;
                  }
                  setDisplayAlert(false);
                }}
                severity="error"
                sx={{ width: '100%' }}
              >
                An error occured!
              </Alert>
            ) : (
              <Alert
                onClose={(
                  event?: React.SyntheticEvent | Event,
                  reason?: string,
                ) => {
                  if (reason === 'clickaway') {
                    return;
                  }
                  setDisplayAlert(false);
                }}
                severity="success"
                sx={{ width: '100%' }}
              >
                Claim successfully added!
              </Alert>
            )}
          </Snackbar>
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const user = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );
  if (!user) {
    return {
      redirect: { destination: '/', permanent: false }, // a next js thing, adapt returnTo as needed
    };
  }

  const verdicts = await getAllVerdicts();
  const labels = await getAllLabels();

  const author = await checkIfAuthorExists(user.id);
  if (author) {
    console.log('user logged in, is author');
    return {
      props: {
        user: user,
        author: author,
        verdicts: verdicts,
        labels: labels,
      },
    };
  }
  console.log('user logged in, but not an author');
  return {
    props: { user: user, author: null, verdicts: verdicts, labels: labels },
  };
}
