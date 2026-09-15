// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BountyHub — community-funded development bounties
/// @notice Native BOT is pooled in each bounty and paid to its winning submitter.
contract BountyHub {
    enum Status { Voting, AwaitingClaim, Claimed, Cancelled }

    struct Bounty {
        address creator;
        string title;
        string description;
        string category;
        uint64 deadline;
        uint128 target;
        uint128 raised;
        uint32 submissionCount;
        uint32 totalVotes;
        uint32 winnerId;
        Status status;
    }

    struct Submission {
        address contributor;
        string proofURI;
        uint32 votes;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(uint256 => Submission)) public submissions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(address => uint256) public totalFunded;
    mapping(address => uint256) public totalEarned;

    uint256 private unlocked = 1;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, string title, uint256 target, uint256 deadline);
    event BountyFunded(uint256 indexed bountyId, address indexed funder, uint256 amount);
    event WorkSubmitted(uint256 indexed bountyId, uint256 indexed submissionId, address indexed contributor, string proofURI);
    event VoteCast(uint256 indexed bountyId, uint256 indexed submissionId, address indexed voter);
    event WinnerSelected(uint256 indexed bountyId, uint256 indexed submissionId, address indexed winner);
    event RewardClaimed(uint256 indexed bountyId, address indexed winner, uint256 amount);
    event BountyCancelled(uint256 indexed bountyId);
    event RefundClaimed(uint256 indexed bountyId, address indexed funder, uint256 amount);

    modifier validBounty(uint256 bountyId) {
        require(bountyId > 0 && bountyId <= bountyCount, "Unknown bounty");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "Reentrant call");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    function createBounty(
        string calldata title,
        string calldata description,
        string calldata category,
        uint128 target,
        uint64 deadline
    ) external payable returns (uint256 bountyId) {
        require(bytes(title).length > 0 && bytes(title).length <= 120, "Invalid title");
        require(bytes(description).length <= 1500, "Description too long");
        require(target > 0, "Target required");
        require(deadline > block.timestamp + 1 hours, "Deadline too soon");
        require(msg.value <= type(uint128).max, "Seed too large");

        bountyId = ++bountyCount;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            title: title,
            description: description,
            category: category,
            deadline: deadline,
            target: target,
            raised: uint128(msg.value),
            submissionCount: 0,
            totalVotes: 0,
            winnerId: 0,
            status: Status.Voting
        });

        if (msg.value > 0) {
            contributions[bountyId][msg.sender] = msg.value;
            totalFunded[msg.sender] += msg.value;
            emit BountyFunded(bountyId, msg.sender, msg.value);
        }
        emit BountyCreated(bountyId, msg.sender, title, target, deadline);
    }

    function fundBounty(uint256 bountyId) external payable validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Voting && block.timestamp < bounty.deadline, "Funding closed");
        require(msg.value > 0, "No BOT sent");
        require(uint256(bounty.raised) + msg.value <= type(uint128).max, "Pool too large");
        bounty.raised += uint128(msg.value);
        contributions[bountyId][msg.sender] += msg.value;
        totalFunded[msg.sender] += msg.value;
        emit BountyFunded(bountyId, msg.sender, msg.value);
    }

    function submitWork(uint256 bountyId, string calldata proofURI) external validBounty(bountyId) returns (uint256 submissionId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Voting && block.timestamp < bounty.deadline, "Submissions closed");
        require(bytes(proofURI).length > 0 && bytes(proofURI).length <= 500, "Invalid proof");
        submissionId = ++bounty.submissionCount;
        submissions[bountyId][submissionId] = Submission(msg.sender, proofURI, 0);
        emit WorkSubmitted(bountyId, submissionId, msg.sender, proofURI);
    }

    function vote(uint256 bountyId, uint256 submissionId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Voting && block.timestamp < bounty.deadline, "Voting closed");
        require(submissionId > 0 && submissionId <= bounty.submissionCount, "Unknown submission");
        require(!hasVoted[bountyId][msg.sender], "Already voted");
        hasVoted[bountyId][msg.sender] = true;
        submissions[bountyId][submissionId].votes++;
        bounty.totalVotes++;
        emit VoteCast(bountyId, submissionId, msg.sender);
    }

    function selectWinner(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Voting && block.timestamp >= bounty.deadline, "Voting active");
        require(bounty.submissionCount > 0, "No submissions");

        uint256 bestId = 1;
        uint32 bestVotes = submissions[bountyId][1].votes;
        for (uint256 i = 2; i <= bounty.submissionCount; i++) {
            uint32 votes = submissions[bountyId][i].votes;
            if (votes > bestVotes) {
                bestVotes = votes;
                bestId = i;
            }
        }
        bounty.winnerId = uint32(bestId);
        bounty.status = Status.AwaitingClaim;
        emit WinnerSelected(bountyId, bestId, submissions[bountyId][bestId].contributor);
    }

    function claimReward(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.AwaitingClaim, "Reward unavailable");
        address winner = submissions[bountyId][bounty.winnerId].contributor;
        require(msg.sender == winner, "Not winner");
        uint256 reward = bounty.raised;
        bounty.raised = 0;
        bounty.status = Status.Claimed;
        totalEarned[winner] += reward;
        (bool sent,) = payable(winner).call{value: reward}("");
        require(sent, "Transfer failed");
        emit RewardClaimed(bountyId, winner, reward);
    }

    function cancelEmptyBounty(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(block.timestamp >= bounty.deadline, "Voting active");
        require(bounty.submissionCount == 0, "Has submissions");
        require(bounty.status == Status.Voting, "Already finalized");
        bounty.status = Status.Cancelled;
        emit BountyCancelled(bountyId);
    }

    function claimRefund(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        require(bounties[bountyId].status == Status.Cancelled, "Refund unavailable");
        uint256 amount = contributions[bountyId][msg.sender];
        require(amount > 0, "Nothing to refund");
        contributions[bountyId][msg.sender] = 0;
        bounties[bountyId].raised -= uint128(amount);
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");
        emit RefundClaimed(bountyId, msg.sender, amount);
    }
}
